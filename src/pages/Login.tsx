import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success("Login successful!");
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin();
        navigate("/dashboard", { replace: true });
      } else {
        message.error(data.error || "Invalid username or password!");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Server connection failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f3f6fb",
        display: "flex",
      }}
    >
      {/* LEFT SIDE PANEL */}
      <div
        style={{
          flex: 1.3,
          background: "#d1d5db", // Professional Neutral Grey
          color: "#0f172a", 
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 60px",
          textAlign: "center",
        }}
      >
        <img
          src="/logo.png"
          alt="TAP Logo"
          style={{ 
            width: 220,
            marginBottom: 24,
            display: "block"
          }}
        />

        <Title
          style={{
            color: "#0f172a",
            fontSize: 42,
            margin: 0,
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        >
         SLA Management System
        </Title>
      </div>

      {/* RIGHT SIDE FORM */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            padding: "40px 38px",
            borderRadius: 14,
            boxShadow:
              "0 4px 25px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
          }}
        >
          <Title
            level={3}
            style={{ marginBottom: 25, fontWeight: 600, color: "#1e293b" }}
          >
            Sign in to your account
          </Title>

          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Username</span>}
              name="username"
              rules={[{ required: true, message: "Please enter username" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#64748b" }} />}
                placeholder="Enter your username"
                size="large"
                style={{
                  borderRadius: 8,
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 500 }}>Password</span>}
              name="password"
              rules={[{ required: true, message: "Please enter password" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#64748b" }} />}
                placeholder="Enter your password"
                size="large"
                iconRender={(visible) =>
                  visible ? (
                    <EyeTwoTone twoToneColor="#2563eb" />
                  ) : (
                    <EyeInvisibleOutlined style={{ color: "#64748b" }} />
                  )
                }
                style={{
                  borderRadius: 8,
                }}
              />
            </Form.Item>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 22,
              }}
            >
              <Form.Item
                name="remember"
                valuePropName="checked"
                style={{ margin: 0 }}
              >
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <Text style={{ color: "#2563eb", cursor: "pointer" }}>
                Forgot Password?
              </Text>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                background: "#2563eb",
                borderRadius: 8,
                height: 48,
                fontWeight: 600,
              }}
            >
              Login
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;