import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, Typography, message, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import GenericList from '../GenericList';
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  fetchServiceProviderLines,
  UserDTO 
} from '../../../api/userApi';
import { fetchLines, LineDTO } from '../../../api/linesApi';
import { fetchServiceProviders, ServiceProviderDTO } from '../../../api/serviceProviderApi';

const { Title } = Typography;
const { confirm } = Modal;

const UsersManager: React.FC = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<UserDTO[]>([]);
  const [lines, setLines] = useState<LineDTO[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderDTO[]>([]);
  const [spLines, setSpLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);

  const userString = sessionStorage.getItem('user');
  const loggedInUser = (() => {
    try {
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  })();

  const selectedSpId = Form.useWatch('sp_id', form);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, linesData, spData, spLinesData] = await Promise.all([
        fetchUsers(undefined, loggedInUser?.user_type),
        fetchLines(),
        fetchServiceProviders(),
        fetchServiceProviderLines()
      ]);
      setRecords(usersData);
      setLines(linesData);
      setServiceProviders(spData);
      setSpLines(spLinesData);
    } catch (error: any) {
      message.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Clear line_id if sp_id changes and current line_id is not compatible
  useEffect(() => {
    if (selectedSpId) {
      const compatibleLines = spLines.filter(link => String(link.sp_id) === String(selectedSpId));
      const currentLineId = form.getFieldValue('line_id');
      if (currentLineId && !compatibleLines.some(link => String(link.line_id) === String(currentLineId))) {
        form.setFieldValue('line_id', undefined);
      }
    }
  }, [selectedSpId, spLines, form]);

  const onFinish = async (values: any) => {
    const payload: any = {
      ...values,
      active_status: values.active_status ?? true,
    };

    if (editing) {
      payload.user_id = editing.user_id;
    }

    try {
      if (editing) {
        await updateUser(payload);
        message.success('User updated successfully!');
      } else {
        await createUser(payload);
        message.success('User added successfully!');
      }
      form.resetFields();
      setEditing(null);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (id: string | number) => {
    const rec = records.find((r) => String(r.user_id) === String(id));
    if (rec) {
      setEditing(rec);
      form.setFieldsValue(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string | number) => {
    confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteUser(Number(id));
          message.success('User deleted successfully');
          loadData();
        } catch (error: any) {
          message.error(error.message || 'Delete failed');
        }
      },
    });
  };

  const spOptions = serviceProviders.map((s) => ({ value: s.sp_id, label: s.sp_name }));

  const lineOptions = lines
    .filter((l) => {
      // 1. Filter by Service Provider junction
      if (selectedSpId) {
        const isLinked = spLines.some(link => 
          String(link.sp_id) === String(selectedSpId) && 
          String(link.line_id) === String(l.line_id)
        );
        if (!isLinked) return false;
      } else {
          // If no SP selected, show no lines (or all? User said "when TAP selected... only designated... visible")
          // Usually better to show none until SP is selected to enforce the relationship.
          return false;
      }

      // 2. Hide if already taken by another user (unique constraint)
      const isTaken = records.some((u) => String(u.line_id) === String(l.line_id));
      if (editing && String(l.line_id) === String(editing.line_id)) {
        return true;
      }
      return !isTaken;
    })
    .map((l) => ({ value: l.line_id, label: l.line_name }));

  const columns = [
    { title: 'Service Provider Name', dataIndex: 'sp_name', key: 'sp_name' },
    { title: 'Line Name', dataIndex: 'line_name', key: 'line_name' },
    { title: 'Full Name', key: 'name', render: (_: any, r: UserDTO) => `${r.first_name} ${r.last_name || ''}` },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { 
      title: 'Status', 
      dataIndex: 'active_status', 
      key: 'active_status',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
    },
  ];

  return (
    <>
      <Title level={2} style={{ marginBottom: 24 }}>Users Management</Title>
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
              <Form.Item name="sp_id" label="Service Provider" rules={[{ required: true }]}>
                <Select placeholder="Select SP" size="large" options={spOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="line_id" label="Line" rules={[{ required: true }]}>
                <Select placeholder="Select line" size="large" options={lineOptions} disabled={!selectedSpId} />
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
                  {editing ? 'Update User' : 'Add User'}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>
      <GenericList 
        title="Users List" 
        dataSource={records.map(r => ({ ...r, id: String(r.user_id) }))} 
        columns={columns} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        exportFilename="users" 
        loading={loading}
      />
    </>
  );
};

export default UsersManager;
