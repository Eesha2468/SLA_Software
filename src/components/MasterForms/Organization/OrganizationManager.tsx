import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag, InputNumber, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchOrganizations, 
  createOrganization, 
  updateOrganization, 
  deleteOrganization,
  OrganizationDTO 
} from '../../../api/organizationApi';

const { Title } = Typography;
const { confirm } = Modal;

const OrganizationManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<OrganizationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<OrganizationDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizations();
      setRecords(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to load organizations');
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
      payload.org_id = editing.org_id;
    }

    try {
      if (editing) {
        await updateOrganization(payload);
        message.success('Organization updated successfully!');
      } else {
        await createOrganization(payload);
        message.success('Organization added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.org_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this organization?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteOrganization(Number(id));
          message.success('Organization deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const parentOptions = records.map((r) => ({ value: r.org_name, label: r.org_name }));

  const columns = [
    { title: 'Organization Name', dataIndex: 'org_name', key: 'org_name' },
    { 
      title: 'Abbreviation', 
      dataIndex: 'org_abbrevation', 
      key: 'org_abbrevation',
      render: (v: string) => <Tag color="blue">{v}</Tag> 
    },
    { title: 'Parent Organization', dataIndex: 'org_parent', key: 'org_parent', render: (v: string) => v || '—' },
    { title: 'Address', dataIndex: 'org_address', key: 'org_address' },
    { title: 'Contact', dataIndex: 'org_contact_no', key: 'org_contact_no' },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Organization Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="org_name" label="Organization Name" rules={[{ required: true }]}>
                <Input placeholder="Enter name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="org_abbrevation" label="Abbreviation" rules={[{ required: true }]}>
                <Input placeholder="Enter abbrev" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="org_contact_no" label="Contact Number" rules={[{ required: true }]}>
                <Input placeholder="Enter contact" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="org_parent" label="Parent Organization">
                <Select placeholder="Select parent" size="large" allowClear options={parentOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item name="org_address" label="Address" rules={[{ required: true }]}>
                <Input placeholder="Enter address" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="org_description" label="Description">
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
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  icon={editing ? <EditOutlined /> : <PlusOutlined />}
                  style={{ height: 45, padding: '0 32px', borderRadius: 8 }}
                >
                  {editing ? 'Update Organization' : 'Add Organization'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="Organizations List" 
        dataSource={records.map(r => ({ ...r, id: String(r.org_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="organizations" 
        loading={loading}
      />
    </>
  );
};

export default OrganizationManager;
