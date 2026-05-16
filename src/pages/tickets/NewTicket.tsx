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
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUserDTO[]>([]);
  const [faultLevels, setFaultLevels] = useState<FaultLevelCategoryDTO[]>([]);
  const [spLines, setSpLines] = useState<any[]>([]);

  const userString = localStorage.getItem('user');
  const loggedInUser = (() => {
    try {
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return null;
    }
  })();
  const isEeshaTap = loggedInUser?.username?.toLowerCase() === 'eesha.tap';
  const isClient = loggedInUser?.user_type === 'client';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [spData, orgData, kpiData, subKpiData, lineData, userData, flData, clientUserData] = await Promise.all([
          fetchServiceProviders(),
          fetchOrganizations(),
          fetchKPICategories(),
          fetchKPISubCategories(),
          fetchLines(),
          fetchUsers(),
          fetchFaultLevelCategories(),
          fetchClientUsers()
        ]);

        // Fetch SP-Line associations from DB
        try {
          const API_BASE_URL = 'http://localhost:5000/api';
          const spLinesRes = await fetch(`${API_BASE_URL}/serviceprovider-lines`);
          if (spLinesRes.ok) {
            const spLinesData = await spLinesRes.json();
            setSpLines(spLinesData);
          }
        } catch (e) {
          console.error("Failed to fetch SP-Line associations", e);
        }

        setServiceProviders(spData);
        setOrganizations(orgData);
        setKpiCategories(kpiData);
        setKpiSubCategories(subKpiData);
        setLines(lineData);
        setUsers(userData);
        setFaultLevels(flData);
        setClientUsers(clientUserData);
      } catch (error) {
        message.error("Failed to load master data");
      }
    };
    loadData();
  }, []);

  const selectedKpiCategory = Form.useWatch('kpi_main_category_id', form);
  const selectedKpiSubCategory = Form.useWatch('kpi_sub_category_id', form);
  const selectedLine = Form.useWatch('line_id', form);
  const selectedServiceProvider = Form.useWatch('sp_id', form);
  const selectedOrganization = Form.useWatch('org_id', form);

  // Filter Service Providers based on selected Line from DB relationships
  const filteredServiceProviders = serviceProviders.filter(sp => 
    spLines.some(spl => String(spl.sp_id) === String(sp.sp_id) && String(spl.line_id) === String(selectedLine))
  );

  // Filter KPI Categories based on selected Line and SP
  const filteredKpiCategories = kpiCategories.filter(cat => {
    const isSp1 = String(cat.sp_id) === '1';
    const isTargetLine = String(selectedLine) === '2' || String(selectedLine) === '5';
    const isCatLineMatched = isSp1 && isTargetLine 
      ? (String(cat.line_id) === '2' || String(cat.line_id) === '5')
      : String(cat.line_id) === String(selectedLine);

    return isCatLineMatched && String(cat.sp_id) === String(selectedServiceProvider || (isEeshaTap ? 1 : ''));
  });

  // Filter Sub-Categories based on Parent, Line, and SP
  const filteredSubCategories = kpiSubCategories.filter(s => {
    const isSp1 = String(s.sp_id) === '1';
    const isTargetLine = String(selectedLine) === '2' || String(selectedLine) === '5';
    const isSubLineMatched = isSp1 && isTargetLine 
      ? (String(s.line_id) === '2' || String(s.line_id) === '5')
      : String(s.line_id) === String(selectedLine);

    return String(s.kpi_main_cat_id) === String(selectedKpiCategory) &&
           isSubLineMatched &&
           String(s.sp_id) === String(selectedServiceProvider || (isEeshaTap ? 1 : ''));
  });

  const filteredFaultLevels = faultLevels.filter(fl => String(fl.kpi_sub_category_id) === String(selectedKpiSubCategory));

  // Personnel Options
  const personnelOptions = isEeshaTap 
    ? clientUsers
        .filter(cu => String(cu.org_id) === String(selectedOrganization))
        .map(cu => ({ value: cu.client_user_id, label: `${cu.first_name} ${cu.last_name || ''}` }))
    : users
        .filter(u => String(u.sp_id) === String(selectedServiceProvider || (isClient ? loggedInUser?.sp_id : 1)))
        .map(u => ({ value: u.user_id, label: `${u.first_name} ${u.last_name || ''}` }));

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
    let spId = values.sp_id;
    let orgId = values.org_id;
    
    if (isEeshaTap) {
      spId = 1; // Trade And Projects
    } else if (isClient) {
      orgId = loggedInUser.org_id;
    }

    const ticketNumber = generateTicketNumber(spId, values.line_id);

    // Convert file to base64 if exists
    let attachmentBase64 = null;
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj || fileList[0];
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
      created_by_type: loggedInUser ? loggedInUser.user_type : 'regular',
      reported_to: values.reported_to,
      reported_to_type: isEeshaTap ? 'client' : 'regular',
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
            {isEeshaTap && (
              <Col xs={24} md={8}>
                <Form.Item name="org_id" label="Organization" rules={[{ required: true }]}>
                  <Select 
                    size="large"
                    placeholder="Select Organization"
                    options={organizations.map(o => ({ value: o.org_id, label: o.org_name }))} 
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={8}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Line" 
                  options={lines.map(l => ({ value: l.line_id, label: l.line_name }))} 
                  onChange={() => {
                    form.setFieldsValue({ sp_id: undefined, org_id: undefined, kpi_main_category_id: undefined, kpi_sub_category_id: undefined });
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            {!isEeshaTap && (
              <Col xs={24} md={8}>
                <Form.Item name="sp_id" label="Service Provider" rules={[{ required: true }]}>
                  <Select 
                    size="large"
                    placeholder="Select Service Provider"
                    options={filteredServiceProviders.map(s => ({ value: s.sp_id, label: s.sp_name }))} 
                    disabled={!selectedLine}
                    onChange={() => {
                      form.setFieldsValue({ kpi_main_category_id: undefined, kpi_sub_category_id: undefined });
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={8}>
              <Form.Item name="kpi_main_category_id" label="Parent KPI Category" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Category" 
                  options={filteredKpiCategories.map(c => ({ value: c.kpi_main_cat_id, label: c.kpi_name }))} 
                  disabled={!selectedLine || (!selectedServiceProvider && !isEeshaTap)}
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
                  options={filteredSubCategories.map(s => ({ value: s.sub_category_id, label: s.sub_category_name }))}
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
                  options={filteredFaultLevels.map(fl => ({ value: fl.fl_category_id, label: fl.fl_name || fl.fl_desc }))}
                  disabled={!selectedKpiSubCategory}
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
              <Form.Item name="reported_to" label="Reported To" rules={[{ required: true }]}>
                <Select 
                  size="large"
                  placeholder="Select Personnel" 
                  options={personnelOptions}
                  disabled={isEeshaTap ? !selectedOrganization : !selectedServiceProvider}
                  style={{ width: '100%' }}
                />
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
              <Form.Item label="Attachments (Optional)" style={{ marginBottom: 0 }}>
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
