/**
 * Match Results Tabs Component
 *
 * Displays matched, unmatched, and missing entries in tabs
 * with ability to map finishes and other specs (width, PCD, holes)
 * and manually match unmatched entries to database alloys
 */

import React, { useState, useCallback } from 'react';
import {
  Tabs,
  Table,
  Tag,
  Badge,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tooltip,
  Modal,
  message,
  Card,
  Divider,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  EditOutlined,
  SearchOutlined,
  SettingOutlined,
  LinkOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { searchAlloys } from '../stockUploadApi';

const { Text, Title } = Typography;
const { Option } = Select;

const MatchResultsTabs = ({
  matched = [],
  notMatched = [],
  missingModels = [],
  missingFinishes = [],
  missingWidths = [],
  missingPcds = [],
  missingHoles = [],
  missingInches = [],
  updates = [],
  noChange = [],
  dbFinishes = [],
  dbSpecs = {},
  customMappings = {},
  onMappingChange,
  onSpecMappingChange,
  manualMatches = {},
  onManualMatchChange
}) => {
  const [searchText, setSearchText] = useState('');
  const [finishMappingModal, setFinishMappingModal] = useState({ visible: false, finish: null });
  const [specMappingModal, setSpecMappingModal] = useState({ visible: false, type: null, value: null });

  // Manual match state
  const [alloySearchResults, setAlloySearchResults] = useState([]);
  const [alloySearchLoading, setAlloySearchLoading] = useState(false);

  // Debounced alloy search
  const debouncedSearchAlloys = useCallback(
    debounce(async (searchValue) => {
      if (!searchValue || searchValue.length < 2) {
        setAlloySearchResults([]);
        return;
      }
      setAlloySearchLoading(true);
      const result = await searchAlloys(searchValue, 30);
      if (result.success) {
        setAlloySearchResults(result.data);
      }
      setAlloySearchLoading(false);
    }, 300),
    []
  );

  // Handle manual match selection
  const handleManualMatchSelect = (entryId, alloyId, alloyData) => {
    if (onManualMatchChange) {
      onManualMatchChange(entryId, alloyId, alloyData);
    }
  };

  // Remove manual match
  const handleRemoveManualMatch = (entryId) => {
    if (onManualMatchChange) {
      onManualMatchChange(entryId, null, null);
    }
  };

  // Filter function for search
  const filterData = (data, searchField = 'alloyName') => {
    if (!searchText) return data;
    return data.filter(item =>
      (item[searchField] || item.excelName || item.productName || '')
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  };

  // Group not matched by reason
  const groupedNotMatched = notMatched.reduce((acc, item) => {
    const reason = item.reasonType || 'other';
    if (!acc[reason]) acc[reason] = [];
    acc[reason].push(item);
    return acc;
  }, {});

  // Matched entries table columns
  const matchedColumns = [
    {
      title: 'Excel Name',
      dataIndex: 'excelName',
      key: 'excelName',
      ellipsis: true,
      width: 250
    },
    {
      title: 'DB Product Name',
      dataIndex: 'dbName',
      key: 'dbName',
      ellipsis: true,
      width: 250
    },
    {
      title: 'Excel Qty',
      dataIndex: 'excelQty',
      key: 'excelQty',
      width: 100,
      align: 'center'
    },
    {
      title: 'DB Stock',
      dataIndex: 'dbInHouseStock',
      key: 'dbInHouseStock',
      width: 100,
      align: 'center'
    },
    {
      title: 'Difference',
      key: 'difference',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const diff = record.excelQty - record.dbInHouseStock;
        if (diff === 0) return <Tag>No Change</Tag>;
        return (
          <Tag color={diff > 0 ? 'green' : 'red'}>
            {diff > 0 ? '+' : ''}{diff}
          </Tag>
        );
      }
    },
    {
      title: 'Sheet',
      dataIndex: 'sheet',
      key: 'sheet',
      width: 120,
      ellipsis: true
    }
  ];

  // Not matched entries table columns
  const notMatchedColumns = [
    {
      title: 'Alloy Name',
      dataIndex: 'alloyName',
      key: 'alloyName',
      ellipsis: true,
      width: 220
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 60,
      align: 'center'
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      ellipsis: true,
      render: (reason, record) => {
        if (record.reasonType === 'missing_components' && record.missingComponents) {
          const finishMissing = record.missingComponents.find(m => m.type === 'finish');
          return (
            <Space direction="vertical" size={4}>
              <Tooltip title={reason}>
                <Text type="danger" style={{ fontSize: 12 }}>{reason}</Text>
              </Tooltip>
              {finishMissing && (
                <Button
                  size="small"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => setFinishMappingModal({
                    visible: true,
                    finish: finishMissing.original || finishMissing.value
                  })}
                >
                  Map Finish
                </Button>
              )}
            </Space>
          );
        }
        return (
          <Tooltip title={reason}>
            <Text type="danger" style={{ fontSize: 12 }}>{reason}</Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Manual Match',
      key: 'manualMatch',
      width: 320,
      render: (_, record) => {
        const entryId = record.id;
        const existingMatch = manualMatches[entryId];

        if (existingMatch) {
          return (
            <Space>
              <Tag color="green" icon={<LinkOutlined />}>
                {existingMatch.productName}
              </Tag>
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveManualMatch(entryId)}
              />
            </Space>
          );
        }

        return (
          <Select
            showSearch
            allowClear
            placeholder="Search to match alloy..."
            style={{ width: '100%' }}
            filterOption={false}
            onSearch={debouncedSearchAlloys}
            onChange={(value) => {
              if (value) {
                const alloy = alloySearchResults.find(a => a.id === value);
                if (alloy) {
                  handleManualMatchSelect(entryId, value, {
                    productId: alloy.id,
                    productName: alloy.productName,
                    inHouseStock: alloy.inHouseStock,
                    excelQty: record.qty
                  });
                  message.success(`Matched "${record.alloyName}" to "${alloy.productName}"`);
                }
              }
            }}
            notFoundContent={alloySearchLoading ? <Spin size="small" /> : <Text type="secondary">Type to search...</Text>}
            dropdownMatchSelectWidth={400}
          >
            {alloySearchResults.map(alloy => (
              <Option key={alloy.id} value={alloy.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{alloy.productName}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {alloy.model} | {alloy.inches}" | {alloy.width} | {alloy.pcd}*{alloy.holes} | {alloy.finish} | Stock: {alloy.inHouseStock}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: 'Sheet',
      dataIndex: 'sheet',
      key: 'sheet',
      width: 100,
      ellipsis: true
    }
  ];

  // Missing models table columns
  const missingModelsColumns = [
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 80
    },
    {
      title: 'Alloy Name',
      dataIndex: 'alloyName',
      key: 'alloyName',
      ellipsis: true,
      width: 200
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 60,
      align: 'center'
    },
    {
      title: 'Specs',
      key: 'specs',
      width: 150,
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag>{record.inches}"</Tag>
          <Tag>{record.width}</Tag>
          <Tag>{record.pcd}*{record.holes}</Tag>
        </Space>
      )
    },
    {
      title: 'Finish',
      dataIndex: 'finish',
      key: 'finish',
      width: 100,
      ellipsis: true
    },
    {
      title: 'Manual Match',
      key: 'manualMatch',
      width: 300,
      render: (_, record) => {
        const entryId = record.id;
        const existingMatch = manualMatches[entryId];

        if (existingMatch) {
          return (
            <Space>
              <Tag color="green" icon={<LinkOutlined />}>
                {existingMatch.productName}
              </Tag>
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveManualMatch(entryId)}
              />
            </Space>
          );
        }

        return (
          <Select
            showSearch
            allowClear
            placeholder="Search to match..."
            style={{ width: '100%' }}
            filterOption={false}
            onSearch={debouncedSearchAlloys}
            onChange={(value) => {
              if (value) {
                const alloy = alloySearchResults.find(a => a.id === value);
                if (alloy) {
                  handleManualMatchSelect(entryId, value, {
                    productId: alloy.id,
                    productName: alloy.productName,
                    inHouseStock: alloy.inHouseStock,
                    excelQty: record.qty
                  });
                  message.success(`Matched "${record.alloyName}" to "${alloy.productName}"`);
                }
              }
            }}
            notFoundContent={alloySearchLoading ? <Spin size="small" /> : <Text type="secondary">Type to search...</Text>}
            dropdownMatchSelectWidth={400}
          >
            {alloySearchResults.map(alloy => (
              <Option key={alloy.id} value={alloy.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{alloy.productName}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {alloy.model} | {alloy.inches}" | {alloy.width} | {alloy.pcd}*{alloy.holes} | {alloy.finish} | Stock: {alloy.inHouseStock}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        );
      }
    },
    {
      title: 'Sheet',
      dataIndex: 'sheet',
      key: 'sheet',
      width: 100,
      ellipsis: true
    }
  ];

  // Updates preview columns
  const updatesColumns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      width: 300
    },
    {
      title: 'Old Stock',
      dataIndex: 'oldStock',
      key: 'oldStock',
      width: 100,
      align: 'center'
    },
    {
      title: 'New Stock',
      dataIndex: 'newStock',
      key: 'newStock',
      width: 100,
      align: 'center'
    },
    {
      title: 'Difference',
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      align: 'center',
      render: (diff) => (
        <Tag color={diff > 0 ? 'green' : 'red'}>
          {diff > 0 ? '+' : ''}{diff}
        </Tag>
      )
    }
  ];

  // Missing finishes summary columns
  const missingFinishesColumns = [
    {
      title: 'Excel Finish',
      dataIndex: 'excelValue',
      key: 'excelValue',
      width: 200
    },
    {
      title: 'Mapped To',
      dataIndex: 'mappedTo',
      key: 'mappedTo',
      width: 200,
      render: (mappedTo) => (
        <Text type="secondary">{mappedTo}</Text>
      )
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      align: 'center'
    },
    {
      title: 'Custom Mapping',
      key: 'customMapping',
      width: 250,
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select database finish"
          value={customMappings.finish?.[record.excelValue] || undefined}
          onChange={(value) => onMappingChange('finish', record.excelValue, value)}
          showSearch
          optionFilterProp="children"
          allowClear
        >
          {dbFinishes.map(f => (
            <Option key={f.id} value={f.finish}>
              {f.finish}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          icon={<EditOutlined />}
          onClick={() => setFinishMappingModal({
            visible: true,
            finish: record.excelValue
          })}
        >
          Map
        </Button>
      )
    }
  ];

  // Generic spec mapping columns factory
  const createSpecMappingColumns = (specType, dbOptions, label) => [
    {
      title: `Excel ${label}`,
      dataIndex: 'excelValue',
      key: 'excelValue',
      width: 150
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      align: 'center'
    },
    {
      title: 'Custom Mapping',
      key: 'customMapping',
      width: 200,
      render: (_, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder={`Select database ${label.toLowerCase()}`}
          value={customMappings[specType]?.[record.excelValue] || undefined}
          onChange={(value) => onSpecMappingChange(specType, record.excelValue, value)}
          showSearch
          optionFilterProp="children"
          allowClear
        >
          {(dbOptions || []).map(opt => (
            <Option key={opt.id} value={String(opt.value)}>
              {opt.value}
            </Option>
          ))}
        </Select>
      )
    }
  ];

  // Finish mapping modal handler
  const handleFinishMapping = (value) => {
    if (finishMappingModal.finish && value) {
      onMappingChange('finish', finishMappingModal.finish, value);
      message.success(`Mapped "${finishMappingModal.finish}" to "${value}"`);
    }
    setFinishMappingModal({ visible: false, finish: null });
  };

  // Calculate total missing specs count
  const totalMissingSpecs = (missingWidths?.length || 0) + (missingPcds?.length || 0) + (missingHoles?.length || 0);

  const tabItems = [
    {
      key: 'matched',
      label: (
        <Badge count={matched.length} style={{ backgroundColor: '#52c41a' }} overflowCount={9999}>
          <span style={{ marginRight: 8 }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> Matched
          </span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={filterData(matched, 'excelName')}
          columns={matchedColumns}
          rowKey={(record, index) => `matched-${record.productId}-${index}`}
          size="small"
          scroll={{ x: 1000, y: 400 }}
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total) => `Total: ${total}` }}
        />
      )
    },
    {
      key: 'notMatched',
      label: (
        <Badge count={notMatched.length} style={{ backgroundColor: '#ff4d4f' }} overflowCount={9999}>
          <span style={{ marginRight: 8 }}>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Not Matched
          </span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={filterData(notMatched)}
          columns={notMatchedColumns}
          rowKey={(record, index) => `notmatched-${index}`}
          size="small"
          scroll={{ x: 800, y: 400 }}
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total) => `Total: ${total}` }}
        />
      )
    },
    {
      key: 'missingModels',
      label: (
        <Badge count={missingModels.length} style={{ backgroundColor: '#fa8c16' }} overflowCount={9999}>
          <span style={{ marginRight: 8 }}>
            <WarningOutlined style={{ color: '#fa8c16' }} /> Missing Models
          </span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={filterData(missingModels)}
          columns={missingModelsColumns}
          rowKey={(record, index) => `missing-${index}`}
          size="small"
          scroll={{ x: 900, y: 400 }}
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total) => `Total: ${total}` }}
        />
      )
    },
    {
      key: 'missingFinishes',
      label: (
        <Badge count={missingFinishes.length} style={{ backgroundColor: '#722ed1' }} overflowCount={9999}>
          <span style={{ marginRight: 8 }}>
            <EditOutlined style={{ color: '#722ed1' }} /> Finish Mapping
          </span>
        </Badge>
      ),
      children: (
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            These finishes from the Excel file could not be matched to database entries.
            Use the dropdown to map them to the correct database finish, then click "Recalculate with Mappings".
          </Text>
          <Table
            dataSource={missingFinishes}
            columns={missingFinishesColumns}
            rowKey={(record) => record.excelValue}
            size="small"
            scroll={{ y: 400 }}
            pagination={false}
          />
        </div>
      )
    },
    {
      key: 'specMapping',
      label: (
        <Badge count={totalMissingSpecs} style={{ backgroundColor: '#13c2c2' }} overflowCount={9999}>
          <span style={{ marginRight: 8 }}>
            <SettingOutlined style={{ color: '#13c2c2' }} /> Spec Mapping
          </span>
        </Badge>
      ),
      children: (
        <div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            These specs (width, PCD, holes) from the Excel file could not be matched to database entries.
            Map them to correct database values, then click "Recalculate with Mappings".
          </Text>

          {/* Width Mapping */}
          {missingWidths.length > 0 && (
            <Card size="small" title={<><Tag color="blue">Width</Tag> Missing Widths ({missingWidths.length})</>} style={{ marginBottom: 16 }}>
              <Table
                dataSource={missingWidths}
                columns={createSpecMappingColumns('width', dbSpecs.widths, 'Width')}
                rowKey={(record) => `width-${record.excelValue}`}
                size="small"
                pagination={false}
              />
            </Card>
          )}

          {/* PCD Mapping */}
          {missingPcds.length > 0 && (
            <Card size="small" title={<><Tag color="green">PCD</Tag> Missing PCDs ({missingPcds.length})</>} style={{ marginBottom: 16 }}>
              <Table
                dataSource={missingPcds}
                columns={createSpecMappingColumns('pcd', dbSpecs.pcds, 'PCD')}
                rowKey={(record) => `pcd-${record.excelValue}`}
                size="small"
                pagination={false}
              />
            </Card>
          )}

          {/* Holes Mapping */}
          {missingHoles.length > 0 && (
            <Card size="small" title={<><Tag color="orange">Holes</Tag> Missing Holes ({missingHoles.length})</>} style={{ marginBottom: 16 }}>
              <Table
                dataSource={missingHoles}
                columns={createSpecMappingColumns('holes', dbSpecs.holes, 'Holes')}
                rowKey={(record) => `holes-${record.excelValue}`}
                size="small"
                pagination={false}
              />
            </Card>
          )}

          {totalMissingSpecs === 0 && (
            <Text type="success">All specs matched successfully!</Text>
          )}
        </div>
      )
    },
    {
      key: 'updates',
      label: (
        <Badge count={updates.length} style={{ backgroundColor: '#1890ff' }} overflowCount={9999}>
          <span style={{ marginRight: 8 }}>
            <CheckCircleOutlined style={{ color: '#1890ff' }} /> Updates Preview
          </span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={filterData(updates, 'productName')}
          columns={updatesColumns}
          rowKey={(record) => record.productId}
          size="small"
          scroll={{ x: 600, y: 400 }}
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (total) => `Total: ${total}` }}
        />
      )
    }
  ];

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search entries..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} />

      {/* Finish Mapping Modal */}
      <Modal
        title={`Map Finish: ${finishMappingModal.finish}`}
        open={finishMappingModal.visible}
        onCancel={() => setFinishMappingModal({ visible: false, finish: null })}
        footer={null}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <Text style={{ display: 'block', marginBottom: 16 }}>
            Select the database finish to map "{finishMappingModal.finish}" to:
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select database finish"
            showSearch
            optionFilterProp="children"
            onChange={handleFinishMapping}
            size="large"
          >
            {dbFinishes.map(f => (
              <Option key={f.id} value={f.finish}>
                {f.finish}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default MatchResultsTabs;
