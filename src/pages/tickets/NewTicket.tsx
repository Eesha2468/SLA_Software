import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button, Card, Row, Col, message, Upload } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useTickets } from "../../hooks/useTickets";
import TicketList from "./TicketList";
import { fetchServiceProviders, ServiceProviderDTO } from "../../api/serviceProviderApi";
import { fetchKPICategories, KPICategoryDTO } from "../../api/kpiCategoryApi";
import { fetchKPISubCategories, KPISubCategoryDTO } from "../../api/kpiSubCategoryApi";
import { fetchLines, LineDTO } from "../../api/linesApi";
import { fetchUsers, UserDTO } from "../../api/userApi";
import { fetchFaultLevelCategories, FaultLevelCategoryDTO } from "../../api/faultLevelApi";
import { fetchOrganizations, OrganizationDTO } from "../../api/organizationApi";
import { TicketDTO } from "../../api/ticketApi";
import { fetchClientUsers, ClientUserDTO } from "../../api/clientUserApi";

const { TextArea } = Input;

const NewTicket: React.FC = () => {
  const [form] = Form.useForm();
  const { tickets, createTicket, deleteTicket, updateTicket, loading, loadTickets } = useTickets();

  const [serviceProviders, setServiceProviders] = useState<ServiceProviderDTO[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDTO[]>([]);
  const [kpiCategories, setKpiCategories] = useState<KPICategoryDTO[]>([]);
  const [kpiSubCategories, setKpiSubCategories] = useState<KPISubCategoryDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [faultLevels, setFaultLevels] = useState<FaultLevelCategoryDTO[]>([]);

  const userString = sessionStorage.getItem('user');
  const loggedInUser = (() => {
    try {
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      console.error("Failed to parse user from sessionStorage", e);
      return null;
    }
  })();
  
  const isClient = loggedInUser?.user_type === 'CLIENT_USER';
  const isRegularUser = loggedInUser?.user_type === 'USER' || loggedInUser?.user_type === 'ADMIN';

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const lineData = await fetchLines();
        setLines(lineData);
      } catch (error) {
        message.error("Failed to load lines");
      }
    };
    loadInitialData();
  }, []);

  const selectedLine = Form.useWatch('line_id', form);
  const selectedServiceProvider = Form.useWatch('sp_id', form);
  const selectedOrganization = Form.useWatch('org_id', form);
  const selectedKpiCategory = Form.useWatch('kpi_main_category_id', form);
  const selectedKpiSubCategory = Form.useWatch('kpi_sub_category_id', form);

  // Cascading Fetch: Line -> Org/SP
  useEffect(() => {
    if (selectedLine) {
      const loadLineRelatedData = async () => {
        try {
          if (isRegularUser) {
            const orgData = await fetchOrganizations(selectedLine);
            setOrganizations(orgData);
            setServiceProviders([]); // Reset SPs
          } else if (isClient) {
            const spData = await fetchServiceProviders(selectedLine);
            setServiceProviders(spData);
            setOrganizations([]); // Reset Orgs
          }
        } catch (error) {
          message.error("Failed to load filtered data for selected line");
        }
      };
      loadLineRelatedData();
    }
  }, [selectedLine, isRegularUser, isClient]);

  // Cascading Fetch: Org/SP -> Personnel & KPIs
  useEffect(() => {
    const spId = isRegularUser ? selectedServiceProvider : (isClient ? selectedServiceProvider : undefined);
    const orgId = isRegularUser ? selectedOrganization : (isClient ? selectedOrganization : undefined);

    if (spId || orgId) {
      const loadOrgOrSpData = async () => {
        try {
          // Fetch Personnel
          if (isRegularUser && selectedOrganization) {
            const clientUsers = await fetchClientUsers(selectedOrganization, loggedInUser?.user_type);
            setPersonnel(clientUsers.map(cu => ({ value: cu.client_user_id, label: `${cu.first_name} ${cu.last_name || ''}`, type: 'CLIENT_USER' })));
          } else if (isClient && selectedServiceProvider) {
            const users = await fetchUsers(selectedServiceProvider);
            setPersonnel(users.map(u => ({ value: u.user_id, label: `${u.first_name} ${u.last_name || ''}`, type: 'USER' })));
          }

          // Fetch KPIs based on Service Provider
          const currentSpId = isRegularUser ? 1 : selectedServiceProvider; // Logic from original code for Eesha.tap/TradeProjects
          if (currentSpId) {
            const kpiData = await fetchKPICategories();
            setKpiCategories(kpiData.filter(cat => String(cat.sp_id) === String(currentSpId) && String(cat.line_id) === String(selectedLine)));
          }
        } catch (error) {
          console.error("Failed to load personnel or KPIs", error);
        }
      };
      loadOrgOrSpData();
    }
  }, [selectedOrganization, selectedServiceProvider, selectedLine, isRegularUser, isClient]);

  // Fetch Sub-KPIs and Fault Levels when KPI Category changes
  useEffect(() => {
    if (selectedKpiCategory) {
      const loadSubKpiData = async () => {
        try {
          const subKpiData = await fetchKPISubCategories();
          const filteredSub = subKpiData.filter(s => String(s.kpi_main_cat_id) === String(selectedKpiCategory) && String(s.line_id) === String(selectedLine));
          setKpiSubCategories(filteredSub);

          const flData = await fetchFaultLevelCategories();
          setFaultLevels(flData);
        } catch (error) {
          console.error("Failed to load sub-KPIs", error);
        }
      };
      loadSubKpiData();
    }
  }, [selectedKpiCategory, selectedLine]);

  const filteredFaultLevels = faultLevels;

  const generateTicketNumber = (spId: number | string, lineId: number | string) => {
    const now = new Date();
    const pad = (num: number, size: number) => String(num).padStart(size, '0');
    const sp = pad(Number(spId || 0), 2);
    const line = pad(Number(lineId || 0), 2);
    const dd = pad(now.getDate(), 2);
    const mm = pad(now.getMonth() + 1, 2);
    const yy = String(now.getFullYear()).slice(-2);
    const hh = pad(now.getHours(), 2);
    const min = pad(now.getMinutes(), 2);
    const ss = pad(now.getSeconds(), 2);
    const mmm = pad(now.getMilliseconds(), 3);
    return `TKT-${sp}${line}${dd}${mm}${yy}${hh}${min}${ss}${mmm}`;
  };

  const [fileList, setFileList] = useState<any[]>([]);

  const onFinish = async (values: any) => {
    let spId = isRegularUser ? 1 : values.sp_id; // Defaulting to 1 for Regular Users as per prompt's implicit context of 'eesha.tap' logic
    let orgId = isClient ? loggedInUser.org_id : values.org_id;

    const ticketNumber = generateTicketNumber(spId || 0, values.line_id);

    // Convert file to base64 if exists
    let attachmentBase64 = null;
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj || fileList[0];
      
      // Check file size (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        message.error("File size should not be greater than 10MB");
        return;
      }

      attachmentBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });
    }

    const dbPayload: any = {
      line_id: values.line_id,
      ticket_number: ticketNumber,
      ticket_title: values.title,
      kpi_main_category_id: values.kpi_main_category_id,
      kpi_sub_category_id: values.kpi_sub_category_id,
      fl_category_id: values.fl_category_id,
      ticket_status: values.ticket_status,
      ticket_description: values.ticket_description,
      sp_id: Number(spId || 0),
      org_id: Number(orgId || 0),
      created_by: loggedInUser ? loggedInUser.id : 1, 
      created_by_type: loggedInUser ? loggedInUser.user_type : 'USER',
      reported_to: values.reported_to,
      reported_to_type: isRegularUser ? 'CLIENT_USER' : 'USER',
      attachment: attachmentBase64 as string,
    };

    try {
      await createTicket(dbPayload);
      message.success("Ticket created successfully!");
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      message.error(error.message || "Failed to create ticket");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card title="Create New Ticket">
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          initialValues={{ ticket_status: 'Open' }}
        >
          <Row gutter={[16, 24]}>
            <Col xs={24} md={8}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Line" 
                  options={lines.map(l => ({ value: l.line_id, label: l.line_name }))} 
                  onChange={() => {
                    form.setFieldsValue({ sp_id: undefined, org_id: undefined, reported_to: undefined, kpi_main_category_id: undefined, kpi_sub_category_id: undefined });
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            {isRegularUser && (
              <Col xs={24} md={8}>
                <Form.Item name="org_id" label="Organization" rules={[{ required: true }]}>
                  <Select 
                    size="large"
                    placeholder="Select Organization"
                    options={organizations.map(o => ({ value: o.org_id, label: o.org_name }))} 
                    disabled={!selectedLine}
                    onChange={() => {
                      form.setFieldsValue({ reported_to: undefined });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            )}

            {isClient && (
              <Col xs={24} md={8}>
                <Form.Item name="sp_id" label="Service Provider" rules={[{ required: true }]}>
                  <Select 
                    size="large"
                    placeholder="Select Service Provider"
                    options={serviceProviders.map(s => ({ value: s.sp_id, label: s.sp_name }))} 
                    disabled={!selectedLine}
                    onChange={() => {
                      form.setFieldsValue({ reported_to: undefined, kpi_main_category_id: undefined, kpi_sub_category_id: undefined });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={8}>
              <Form.Item name="reported_to" label="Personnel Name" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Personnel" 
                  options={personnel}
                  disabled={isRegularUser ? !selectedOrganization : !selectedServiceProvider}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="kpi_main_category_id" label="Parent KPI Category" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Category" 
                  options={kpiCategories.map(c => ({ value: c.kpi_main_cat_id, label: c.kpi_name }))} 
                  disabled={!selectedLine || (isClient && !selectedServiceProvider)}
                  onChange={() => {
                    form.setFieldsValue({ kpi_sub_category_id: undefined });
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="kpi_sub_category_id" label="KPI Sub-Category" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Sub-Category" 
                  options={kpiSubCategories.map(s => ({ value: s.sub_category_id, label: s.sub_category_name }))}
                  disabled={!selectedKpiCategory}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="fl_category_id" label="Fault Level" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Fault Level"
                  options={filteredFaultLevels.map(fl => {
                    let label = fl.fl_name || fl.fl_desc || '';
                    if (label.toLowerCase() === 'material') {
                      label = 'Major';
                    }
                    return { value: Number(fl.fl_category_id), label };
                  })}
                  disabled={!selectedKpiCategory}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="title" label="Ticket Title">
                <Input size="large" placeholder="Enter ticket title" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item name="ticket_status" label="Status" rules={[{ required: true }]}>
                <Select size="large" placeholder="Select Status" style={{ width: '100%' }}>
                  <Select.Option value="Open">Open</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="ticket_description" label="Detailed Description" rules={[{ required: true }]}>
                <TextArea rows={4} placeholder="Provide details about the issue" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} align="middle" style={{ marginTop: 8 }}>
            <Col flex="auto">
              <Form.Item label="Attachment (optional, max size: 10MB)" style={{ marginBottom: 0 }}>
                <Upload 
                  beforeUpload={() => false} 
                  maxCount={1}
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                >
                  <Button icon={<UploadOutlined />} size="large">Select File</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} size="large" loading={loading} style={{ height: 45, padding: '0 32px', borderRadius: 8 }}>
                Generate Ticket
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Ticket List">
        <TicketList 
          tickets={tickets} 
          loading={loading} 
          deleteTicket={deleteTicket} 
          updateTicket={updateTicket} 
        />
      </Card>
    </div>
  );
};

export default NewTicket;
