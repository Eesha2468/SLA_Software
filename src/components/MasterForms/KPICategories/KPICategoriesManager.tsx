import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag, Modal, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchKPICategories, 
  createKPICategory, 
  updateKPICategory, 
  deleteKPICategory,
  KPICategoryDTO 
} from '../../../api/kpiCategoryApi';
import { fetchLines, LineDTO } from '../../../api/linesApi';
import { fetchServiceProviders, ServiceProviderDTO } from '../../../api/serviceProviderApi';

const { Title } = Typography;
const { confirm } = Modal;

const KPICategoriesManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<KPICategoryDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<KPICategoryDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, linesData, spData] = await Promise.all([
        fetchKPICategories(),
        fetchLines(),
        fetchServiceProviders()
      ]);
      setRecords(kpiData);
      setLines(linesData);
      setServiceProviders(spData);
    } catch (error: any) {
      message.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFinish = async (values: any) => {
    const payload: any = {
      ...values,
    };

    if (editing) {
      payload.kpi_main_cat_id = editing.kpi_main_cat_id;
    }

    try {
      if (editing) {
        await updateKPICategory(payload);
        message.success('KPI Category updated successfully!');
      } else {
        await createKPICategory(payload);
        message.success('KPI Category added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.kpi_main_cat_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this KPI category?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteKPICategory(Number(id));
          message.success('KPI Category deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const lineOptions = lines.map((l) => ({ value: l.line_id, label: l.line_name }));
  const spOptions = serviceProviders.map((s) => ({ value: s.sp_id, label: s.sp_name }));

  const columns = [
    { title: 'Service Provider', dataIndex: 'sp_name', key: 'sp_name' },
    { title: 'KPI Name', dataIndex: 'kpi_name', key: 'kpi_name' },
    { title: 'Line', key: 'line_name', render: () => 'Orange Line/Airport Service' },
    { 
      title: 'KPI Status', 
      dataIndex: 'kpi_status', 
      key: 'kpi_status',
      render: (v: string) => <Tag color={v === 'Active' ? 'green' : 'red'}>{v}</Tag>
    },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>KPI Categories Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" initialValues={{ kpi_status: 'Active' }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="kpi_name" label="KPI Category Name" rules={[{ required: true }]}>
                <Input placeholder="Enter name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="weight" label="Weight">
                <InputNumber placeholder="Weight" size="large" style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select placeholder="Select line" size="large" options={lineOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sp_id" label="Service Provider" rules={[{ required: true }]}>
                <Select placeholder="Select SP" size="large" options={spOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="kpi_status" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select status" size="large" options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={18}>
              <Form.Item name="kpi_desc" label="Description">
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
                  {editing ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="KPI Categories List" 
        dataSource={records.map(r => ({ ...r, id: String(r.kpi_main_cat_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="kpi_categories" 
        loading={loading}
      />
    </>
  );
};

export default KPICategoriesManager;
