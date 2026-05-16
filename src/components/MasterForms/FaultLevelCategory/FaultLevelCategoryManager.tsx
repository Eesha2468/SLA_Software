import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, Typography, message, Modal, Select } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchFaultLevelCategories, 
  createFaultLevelCategory, 
  updateFaultLevelCategory, 
  deleteFaultLevelCategory,
  FaultLevelCategoryDTO 
} from '../../../api/faultLevelApi';
import { fetchServiceProviders, ServiceProviderDTO } from '../../../api/serviceProviderApi';
import { fetchLines, LineDTO } from '../../../api/linesApi';
import { fetchKPICategories, KPICategoryDTO } from '../../../api/kpiCategoryApi';
import { fetchKPISubCategories, KPISubCategoryDTO } from '../../../api/kpiSubCategoryApi';

const { Title } = Typography;
const { confirm } = Modal;

const FaultLevelCategoryManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<FaultLevelCategoryDTO[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [kpiCategories, setKpiCategories] = useState<KPICategoryDTO[]>([]);
  const [kpiSubCategories, setKpiSubCategories] = useState<KPISubCategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<FaultLevelCategoryDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flData, spData, lineData, kpiData, subKpiData] = await Promise.all([
        fetchFaultLevelCategories(),
        fetchServiceProviders(),
        fetchLines(),
        fetchKPICategories(),
        fetchKPISubCategories()
      ]);
      setRecords(flData);
      setServiceProviders(spData);
      setLines(lineData);
      setKpiCategories(kpiData);
      setKpiSubCategories(subKpiData);
    } catch (error: any) {
      message.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedSP = Form.useWatch('sp_id', form);
  const selectedLine = Form.useWatch('line_id', form);
  const selectedKpiMain = Form.useWatch('kpi_main_cat_id', form);

  const onFinish = async (values: any) => {
    const payload: any = {
      ...values,
    };

    if (editing) {
      payload.fl_category_id = editing.fl_category_id;
    }

    try {
      if (editing) {
        await updateFaultLevelCategory(payload);
        message.success('Fault Level Category updated successfully!');
      } else {
        await createFaultLevelCategory(payload);
        message.success('Fault Level Category added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.fl_category_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this fault level category?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteFaultLevelCategory(Number(id));
          message.success('Fault Level Category deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const columns = [
    { title: 'Service Provider', dataIndex: 'sp_name', key: 'sp_name' },
    { title: 'Line', dataIndex: 'line_name', key: 'line_name' },
    { title: 'KPI Category', dataIndex: 'main_category_name', key: 'main_category_name' },
    { title: 'Sub-Category', dataIndex: 'sub_category_name', key: 'sub_category_name' },
    { title: 'Fault Name', dataIndex: 'fl_name', key: 'fl_name' },
    { title: 'Res. Time', dataIndex: 'resolution_time', key: 'resolution_time' },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Fault Level Category Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="sp_id" label="Service Provider" rules={[{ required: true }]}>
                <Select 
                  placeholder="Select provider" 
                  size="large"
                  options={serviceProviders.map(s => ({ value: s.sp_id, label: s.sp_name }))}
                  onChange={() => {
                    form.setFieldsValue({ kpi_main_cat_id: undefined, kpi_sub_category_id: undefined });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select 
                  placeholder="Select line" 
                  size="large"
                  options={lines.map(l => ({ value: l.line_id, label: l.line_name }))}
                  onChange={() => {
                    form.setFieldsValue({ kpi_main_cat_id: undefined, kpi_sub_category_id: undefined });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="kpi_main_cat_id" label="KPI Main Category" rules={[{ required: true }]}>
                <Select 
                  placeholder="Select main category" 
                  size="large"
                  options={kpiCategories
                    .filter(c => String(c.sp_id) === String(selectedSP) && String(c.line_id) === String(selectedLine))
                    .map(c => ({ value: c.kpi_main_cat_id, label: c.kpi_name }))
                  }
                  disabled={!selectedSP || !selectedLine}
                  onChange={() => {
                    form.setFieldsValue({ kpi_sub_category_id: undefined });
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="kpi_sub_category_id" label="KPI Sub-Category" rules={[{ required: true }]}>
                <Select 
                  placeholder="Select sub-category" 
                  size="large"
                  options={kpiSubCategories
                    .filter(s => String(s.kpi_main_cat_id) === String(selectedKpiMain))
                    .map(s => ({ value: s.sub_category_id, label: s.sub_category_name }))
                  }
                  disabled={!selectedKpiMain}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="fl_name" label="Fault Name" rules={[{ required: true }]}>
                <Select placeholder="Select fault" size="large" disabled={!selectedSP}>
                  <Select.Option value="Major">Major</Select.Option>
                  <Select.Option value="Severe">Severe</Select.Option>
                  <Select.Option value="Minor">Minor</Select.Option>
                  <Select.Option value="Material">Material</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="resolution_time" label="Resolution Time">
                <Input placeholder="e.g. 4 Hours" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="fl_desc" label="Description">
                <Input placeholder="Enter description" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" style={{ marginTop: 8 }}>
            <Col>
              <div style={{ display: 'flex', gap: 12 }}>
                {editing && (
                  <Button size="large" onClick={() => { setEditing(null); form.resetFields(); }}>
                    Cancel
                  </Button>
                )}
                <Button type="primary" htmlType="submit" size="large" icon={editing ? <EditOutlined /> : <PlusOutlined />}>
                  {editing ? 'Update Fault Level' : 'Add Fault Level'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="Fault Level Categories List" 
        dataSource={records.map(r => ({ ...r, id: String(r.fl_category_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="fault_level_categories" 
        loading={loading}
      />
    </>
  );
};

export default FaultLevelCategoryManager;
