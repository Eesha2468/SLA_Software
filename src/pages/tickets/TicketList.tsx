import React, { useState, useEffect } from "react";
import { Table, Tag, Typography, Button, Space, Modal, Form, Select, Input, message, Checkbox, Upload, Popconfirm } from "antd";
import { EditOutlined, UploadOutlined, DeleteOutlined, SearchOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { useTickets } from "../../hooks/useTickets";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { TicketDTO, markAllTicketsAsRead } from "../../api/ticketApi";

const { Text } = Typography;
const { TextArea } = Input;

interface TicketListProps {
  tickets?: TicketDTO[];
  loading?: boolean;
  deleteTicket?: (id: number) => Promise<void>;
  updateTicket?: (ticket: TicketDTO) => Promise<void>;
}

const TicketList: React.FC<TicketListProps> = (props) => {
  const hookData = useTickets();
  
  const tickets = props.tickets ?? hookData.tickets;
  const loading = props.loading ?? hookData.loading;
  const deleteTicketAction = props.deleteTicket ?? hookData.deleteTicket;
  const updateTicketAction = props.updateTicket ?? hookData.updateTicket;

  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketDTO | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [form] = Form.useForm();

  const userString = sessionStorage.getItem('user');
  const loggedInUser = (() => {
    try {
      return userString ? JSON.parse(userString) : null;
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    const clearNotifications = async () => {
      if (loggedInUser) {
        try {
          await markAllTicketsAsRead(loggedInUser.id, loggedInUser.user_type);
        } catch (error) {
          console.error("Failed to clear notifications:", error);
        }
      }
    };
    clearNotifications();
  }, [loggedInUser?.id]);

  const filteredTickets = (tickets || []).filter((t) => {
    const search = searchText.toLowerCase();
    return (
      t.ticket_number?.toLowerCase().includes(search) ||
      t.ticket_title?.toLowerCase().includes(search)
    );
  });

  const handleEdit = (record: TicketDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isReceiver = String(loggedInUser?.id) === String(record.reported_to);
    const isSender = String(loggedInUser?.id) === String(record.created_by);

    if (!isReceiver && !isSender) {
      message.error("You do not have permission to edit this ticket.");
      return;
    }

    setEditingTicket(record);
    setFileList([]);
    
    form.setFieldsValue({
      ticket_status: record.ticket_status,
      remarks: '',
      send_back: isReceiver, 
    });
    setIsEditModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingTicket) return;
    try {
      const values = await form.validateFields();
      const isSender = String(loggedInUser?.id) === String(editingTicket.created_by);
      const isReceiver = String(loggedInUser?.id) === String(editingTicket.reported_to);
      
      const payload: any = {
        ticket_id: editingTicket.ticket_id,
        ticket_status: isSender ? values.ticket_status : editingTicket.ticket_status,
        remarks: values.remarks,
        updated_by: loggedInUser?.id,
        updated_by_type: loggedInUser?.user_type || 'USER',
      };

      if (values.send_back) {
        if (isReceiver) {
           payload.reported_to = editingTicket.created_by;
           payload.reported_to_type = editingTicket.created_by_type;
        }
      }

      await updateTicketAction(payload);
      message.success("Ticket updated successfully");
      setIsEditModalVisible(false);
      setEditingTicket(null);
      setFileList([]);
    } catch (error: any) {
      message.error(error.message || "Failed to update ticket");
    }
  };

  const columns = [
    {
      title: "Ticket #",
      dataIndex: "ticket_number",
      key: "ticket_number",
      width: 150,
      render: (text: string, record: TicketDTO) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.ticket_title}</Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "ticket_description",
      key: "ticket_description",
      ellipsis: true,
    },
    {
      title: "Service Provider",
      dataIndex: "sp_name",
      key: "sp_name",
      width: 150,
    },
    {
        title: "Line",
        dataIndex: "line_name",
        key: "line_name",
        width: 100,
      },
    {
      title: "Status",
      dataIndex: "ticket_status",
      key: "ticket_status",
      width: 100,
      render: (status: string) => {
        let color = "blue";
        if (status === "Resolved" || status === "Close") color = "success";
        else if (status === "Cancel") color = "error";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
        title: "Created By",
        dataIndex: "creator_name",
        key: "creator_name",
        width: 150,
      },
    {
        title: "Reported To",
        dataIndex: "reported_to_name",
        key: "reported_to_name",
        width: 150,
      },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date: string) => dayjs(date).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: TicketDTO) => {
        const canEdit = String(loggedInUser?.id) === String(record.reported_to);
        const isFinalStatus = ['resolved', 'cancel', 'close'].includes(record.ticket_status?.toLowerCase() || '');
        
        return (
          <Space size="middle" onClick={(e) => e.stopPropagation()}>
            {canEdit && !isFinalStatus && (
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={(e) => handleEdit(record, e)} 
              />
            )}
            {!canEdit && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {isFinalStatus ? 'Locked' : 'View Only'}
              </Text>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by ticket # or title..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, borderRadius: 8 }}
          allowClear
          size="large"
        />
      </div>

      <Table
        dataSource={filteredTickets}
        rowKey="ticket_id"
        columns={columns}
        loading={loading}
        onRow={(record) => ({
          onClick: () => navigate(`/tickets/${record.ticket_id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      <Modal
        title={`Update Ticket: ${editingTicket?.ticket_number}`}
        open={isEditModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {editingTicket && String(loggedInUser?.id) === String(editingTicket.created_by) ? (
            <Form.Item name="ticket_status" label="Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="Open">Open</Select.Option>
                <Select.Option value="In Progress">In Progress</Select.Option>
                <Select.Option value="Resolved">Resolved</Select.Option>
                <Select.Option value="Close">Close</Select.Option>
                <Select.Option value="Cancel">Cancel</Select.Option>
              </Select>
            </Form.Item>
          ) : (
            <Form.Item label="Current Status">
              <Tag color="blue">{editingTicket?.ticket_status?.toUpperCase()}</Tag>
            </Form.Item>
          )}
          
          <Form.Item name="remarks" label="Remarks / Comments" rules={[{ required: true, message: 'Please provide remarks' }]}>
            <TextArea rows={4} placeholder="Enter your remarks here..." />
          </Form.Item>

          <Form.Item name="send_back" valuePropName="checked">
            <Checkbox>
              {editingTicket && String(loggedInUser?.id) === String(editingTicket.created_by) 
                ? "Send back to Personnel" 
                : `Send back to Creator (${editingTicket?.creator_name})`}
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TicketList;