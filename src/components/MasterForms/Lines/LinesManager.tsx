import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchLines, 
  createLine, 
  updateLine, 
  deleteLine,
  LineDTO 
} from '../../../api/linesApi';
import { fetchOrganizations, OrganizationDTO } from '../../../api/organizationApi';

const { Title } = Typography;
const { confirm } = Modal;

const LinesManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<LineDTO[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<LineDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [linesData, orgsData] = await Promise.all([
        fetchLines(),
        fetchOrganizations()
      ]);
      setRecords(linesData);
      setOrganizations(orgsData);
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
      payload.line_id = editing.line_id;
    }

    try {
      if (editing) {
        await updateLine(payload);
        message.success('Line updated successfully!');
      } else {
        await createLine(payload);
        message.success('Line added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.line_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this line?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteLine(Number(id));
          message.success('Line deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const orgOptions = organizations.map((o) => ({ value: o.org_id, label: o.org_name }));

  // Get unique colors and types from existing records
  const colorOptions = Array.from(new Set(records.map(r => r.line_color).filter(Boolean)))
    .map(color => ({ value: color, label: color }));
  
  const typeOptions = Array.from(new Set(records.map(r => r.line_type).filter(Boolean)))
    .map(type => ({ value: type, label: type }));

  const columns = [
    { title: 'Organization', dataIndex: 'org_name', key: 'org_name' },
    { title: 'Line Name', dataIndex: 'line_name', key: 'line_name' },
    { title: 'Abbreviation', dataIndex: 'line_abbrevation', key: 'line_abbrevation' },
    { title: 'Type', dataIndex: 'line_type', key: 'line_type' },
    { title: 'Color', dataIndex: 'line_color', key: 'line_color' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'City', dataIndex: 'line_city', key: 'line_city' },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Lines Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="org_id" label="Organization" rules={[{ required: true }]}>
                <Select placeholder="Select org" size="large" options={orgOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_name" label="Line Name" rules={[{ required: true }]}>
                <Input placeholder="Enter line name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_abbrevation" label="Abbreviation" rules={[{ required: true }]}>
                <Input placeholder="Enter abbrev" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_city" label="City">
                <Input placeholder="Enter city" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item name="line_color" label="Line Color">
                <Select placeholder="Select color" size="large" options={colorOptions} showSearch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="line_type" label="Line Type">
                <Select placeholder="Select type" size="large" options={typeOptions} showSearch />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="description" label="Description">
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
                  {editing ? 'Update Line' : 'Add Line'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="Lines List" 
        dataSource={records.map(r => ({ ...r, id: String(r.line_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="lines" 
        loading={loading}
      />
    </>
  );
};

export default LinesManager;
