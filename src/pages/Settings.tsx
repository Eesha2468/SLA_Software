import React from 'react';
import { Card, Row, Col, Typography, Form, Input, Button, Select, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const [systemForm] = Form.useForm();

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Settings</Title>

      {/* System Settings */}
      <Card title="System Settings" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: 'none', marginBottom: 24 }}>
        <Form form={systemForm} layout="vertical" onFinish={() => message.success('System settings saved!')}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="systemName" label="System Name" initialValue="SLA Management System">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="organization" label="Organization" initialValue="TAP Trade and Projects">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="timezone" label="Timezone" initialValue="Asia/Karachi">
                <Select size="large" options={[
                  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="dateFormat" label="Date Format" initialValue="YYYY-MM-DD">
                <Select size="large" options={[
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large" style={{ marginTop: 30 }}>
                  Save System Settings
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

    </div>
  );
};

export default Settings;
