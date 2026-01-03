/**
 * Excel Uploader Component
 *
 * Drag and drop or click to upload Excel files
 */

import React from 'react';
import { Upload, Typography, Space } from 'antd';
import { InboxOutlined, FileExcelOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const ExcelUploader = ({ onUpload, uploading }) => {
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: onUpload,
    disabled: uploading
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 0' }}>
      <Dragger {...uploadProps} style={{ padding: '40px 20px' }}>
        <p className="ant-upload-drag-icon">
          {uploading ? (
            <InboxOutlined style={{ color: '#1890ff', fontSize: 64 }} spin />
          ) : (
            <FileExcelOutlined style={{ color: '#52c41a', fontSize: 64 }} />
          )}
        </p>
        <Title level={4} style={{ marginBottom: 8 }}>
          {uploading ? 'Processing Excel File...' : 'Click or drag file to upload'}
        </Title>
        <Text type="secondary">
          Support for Excel files (.xlsx, .xls)
        </Text>
        <div style={{ marginTop: 16 }}>
          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              The Excel file should contain PLATI sheets with stock data
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Format: MODEL | SIZE | PCD | ... | COLOR | ... | QTY
            </Text>
          </Space>
        </div>
      </Dragger>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Space direction="vertical" size={8}>
          <Text type="secondary">
            Expected columns: MODEL, SIZE, PCD, COLOR/FINISH, QTY
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Maximum file size: 50MB
          </Text>
        </Space>
      </div>
    </div>
  );
};

export default ExcelUploader;
