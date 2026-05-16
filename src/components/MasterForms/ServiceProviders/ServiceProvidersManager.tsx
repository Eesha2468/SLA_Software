import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchServiceProviders, 
  createServiceProvider, 
  updateServiceProvider, 
  deleteServiceProvider,
  ServiceProviderDTO 
} from '../../../api/serviceProviderApi';
import { fetchLines, LineDTO } from '../../../api/linesApi';

const { Title } = Typography;
const { confirm } = Modal;

const ServiceProvidersManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<ServiceProviderDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ServiceProviderDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [spData, linesData] = await Promise.all([
        fetchServiceProviders(),
        fetchLines()
      ]);
      setRecords(spData);
      setLines(linesData);
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
      active: values.active ?? true,
      // If we use multiple select, we join them as string or handle appropriately
      service_category: Array.isArray(values.line_ids) ? values.line_ids.join(', ') : values.line_ids
    };

    if (editing) {
      payload.sp_id = editing.sp_id;
    }

    try {
      if (editing) {
        await updateServiceProvider(payload);
        message.success('Service Provider updated successfully!');
      } else {
        await createServiceProvider(payload);
        message.success('Service Provider added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.sp_id) === String(id));
    if (rec) {
      setEditing(rec);
      // Convert service_category string back to array for Select
      const line_ids = rec.service_category ? rec.service_category.split(', ') : [];
      form.setFieldsValue({ ...rec, line_ids });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this service provider?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteServiceProvider(Number(id));
          message.success('Service Provider deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const lineOptions = lines.map(line => ({ 
    value: line.line_name, 
    label: line.line_name 
  }));

  const columns = [
    { title: 'Service Provider Name', dataIndex: 'sp_name', key: 'sp_name' },
    { title: 'Abbreviation', dataIndex: 'sp_abbreviation', key: 'sp_abbreviation' },
    { 
      title: 'Associated Lines', 
      dataIndex: 'service_category', 
      key: 'service_category',
      render: (v: string) => v ? v.split(', ').map(line => <Tag key={line} color="blue">{line}</Tag>) : 'N/A'
    },
    { title: 'Contact No', dataIndex: 'sp_contact_no', key: 'sp_contact_no' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    { 
      title: 'Status', 
      dataIndex: 'active', 
      key: 'active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
    },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Service Providers Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" initialValues={{ active: true }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="sp_name" label="Service Provider Name" rules={[{ required: true }]}>
                <Input placeholder="Enter name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sp_abbreviation" label="Abbreviation">
                <Input placeholder="Enter abbrev" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_ids" label="Lines" rules={[{ required: true, message: 'Please select at least one line' }]}>
                <Select 
                  mode="multiple"
                  placeholder="Select lines" 
                  size="large" 
                  options={lineOptions} 
                  showSearch 
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="sp_contact_no" label="Contact Number">
                <Input placeholder="Enter contact" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="active" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select status" size="large" options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={18}>
              <Form.Item name="address" label="Address">
                <Input placeholder="Enter address" size="large" />
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
                  {editing ? 'Update Provider' : 'Add Provider'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="Service Providers List" 
        dataSource={records.map(r => ({ ...r, id: String(r.sp_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="service_providers" 
        loading={loading}
      />
    </>
  );
};

export default ServiceProvidersManager;
