import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchClientUsers, 
  createClientUser, 
  updateClientUser, 
  deleteClientUser,
  ClientUserDTO 
} from '../../../api/clientUserApi';
import { fetchLines, LineDTO } from '../../../api/linesApi';
import { fetchOrganizations, OrganizationDTO } from '../../../api/organizationApi';

const { Title } = Typography;
const { confirm } = Modal;

const ClientUsersManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<ClientUserDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ClientUserDTO | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, linesData, orgData] = await Promise.all([
        fetchClientUsers(),
        fetchLines(),
        fetchOrganizations()
      ]);
      setRecords(usersData);
      setLines(linesData);
      setOrganizations(orgData);
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
      active_status: values.active_status ?? true,
    };

    if (editing) {
      payload.client_user_id = editing.client_user_id;
    }

    try {
      if (editing) {
        await updateClientUser(payload);
        message.success('Client User updated successfully!');
      } else {
        await createClientUser(payload);
        message.success('Client User added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.client_user_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this client user?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteClientUser(Number(id));
          message.success('Client User deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const lineOptions = lines
    .filter((l) => {
      // Find if this line is already taken by ANY client user
      const isTaken = records.some((u) => u.line_id === l.line_id);
      
      // If we are editing, ALLOW the line that belongs to the current editing record
      if (editing && l.line_id === editing.line_id) {
        return true;
      }
      
      // Otherwise, hide if taken
      return !isTaken;
    })
    .map((l) => ({ value: l.line_id, label: l.line_name }));

  const orgOptions = organizations.map((o) => ({ value: o.org_id, label: o.org_name }));

  const columns = [
    { title: 'Organization Name', dataIndex: 'org_name', key: 'org_name' },
    { title: 'Line Name', dataIndex: 'line_name', key: 'line_name' },
    { title: 'Full Name', key: 'name', render: (_: any, r: ClientUserDTO) => `${r.first_name} ${r.last_name || ''}` },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Designation', dataIndex: 'user_designation', key: 'user_designation' },
    { 
      title: 'Status', 
      dataIndex: 'active_status', 
      key: 'active_status',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
    },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Client Users Management</Title>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" initialValues={{ active_status: true, username: '', password: '' }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="Enter first name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="last_name" label="Last Name">
                <Input placeholder="Enter last name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="user_email" label="Email" rules={[{ type: 'email' }]}>
                <Input placeholder="Enter email" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                <Input placeholder="Enter username" size="large" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="password" label="Password" rules={[{ required: !editing }]}>
                <Input.Password placeholder="Enter password" size="large" autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="user_designation" label="Designation">
                <Input placeholder="Enter designation" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="org_id" label="Organization" rules={[{ required: true }]}>
                <Select placeholder="Select org" size="large" options={orgOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select placeholder="Select line" size="large" options={lineOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item name="active_status" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select status" size="large" options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="CNIC" label="CNIC">
                <Input placeholder="Enter CNIC" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="emp_id" label="Employee ID">
                <Input placeholder="Enter employee ID" size="large" />
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
                  {editing ? 'Update Client User' : 'Add Client User'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="Client Users List" 
        dataSource={records.map(r => ({ ...r, id: String(r.client_user_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="client_users" 
        loading={loading}
      />
    </>
  );
};

export default ClientUsersManager;
