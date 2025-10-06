// import React, { useEffect, useState } from "react";
// import { Row, Col, Space, Tag, Flex, Segmented } from "antd";
// import CustomTable from "../../Core/Components/CustomTable";
// import { PlusOutlined } from "@ant-design/icons";
// import { Link, useNavigate } from "react-router-dom";
// import Button from "../../Core/Components/CustomButton";
// import { getAllDealers } from "../../redux/api/stockAPI";
// import { useDispatch, useSelector } from "react-redux";
// import CustomInput from "../../Core/Components/CustomInput";



// const AdminDailyEntryDealersPage = () => {
//     const [activeTab, setActiveTab] = useState(1);
//     const navigate = useNavigate();
//     const dispatch = useDispatch();
//     const { allDealers } = useSelector((state) => state.stockDetails);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [pageSize, setPageSize] = useState(10);

//     useEffect(() => {
//         dispatch(getAllDealers({}))
//         console.log(allDealers, "DEALERS")
//     }, [])

//     const columns = [
//         {
//             title: "Dealer Name",
//             dataIndex: "label",
//             key: "label",
//             render: (text) => <div>{text}</div>,
//         },
//         // {
//         //     title: "Age",
//         //     dataIndex: "age",
//         //     key: "age",
//         // },
//         // {
//         //     title: "Address",
//         //     dataIndex: "address",
//         //     key: "address",
//         // },
//     ];

//     return (
//         <div className="w-full h-full p-5 bg-gray-200">
//             <Row gutter={16}>
//                 <Col span={24}>
//                     <div>
//                         <CustomInput placeholder={"Search Dealers"} intent={"search"} />
//                     </div>
//                     <div>
//                         <CustomTable
//                             data={allDealers}
//                             titleOnTop={false}
//                             position="bottomRight"
//                             columns={columns}
//                             expandable={false}
//                             totalCount={allDealers?.length}
//                             currentPage={currentPage}
//                             handlePageChange={setCurrentPage}
//                             pageSize={pageSize}
//                         />
//                     </div>
//                 </Col>
//             </Row>
//         </div>
//     );
// };

// export default AdminDailyEntryDealersPage;

import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Input, 
  Table, 
  Tag, 
  Badge, 
  Space, 
  Typography,
  Button,
  Avatar,
  Tooltip,
  message,
  Modal
} from 'antd';
import { 
  SearchOutlined, 
  UserOutlined, 
  SyncOutlined,
  ArrowRightOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Checkbox } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllDealers } from '../../redux/api/stockAPI';
import { client } from '../../Utils/axiosClient';

const { Text } = Typography;
const { Search } = Input;

const AdminDailyEntryDealersPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { allDealers, dealersPagination } = useSelector((state) => state.stockDetails);
    const { user } = useSelector((state) => state.userDetails);
    
    // State management
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [recalculatingAll, setRecalculatingAll] = useState(false);

    useEffect(() => {
        fetchDealers();
    }, [dispatch, currentPage, pageSize, searchQuery, showOverdueOnly]);

    const fetchDealers = async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, limit: pageSize };
            if (user.roleId !== 5) {
                params.id = user.userId;
            }
            if (searchQuery) {
                params.search = searchQuery;
            }
            if (showOverdueOnly) {
                params.overdue = true;
            }
            await dispatch(getAllDealers(params));
        } catch (error) {
            console.error('Error fetching dealers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size !== pageSize) {
            setPageSize(size);
        }
    };

    // Handle search with debouncing
    const handleSearch = (value) => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to first page on search
    };

    // Handle dealer click
    const handleDealerClick = (dealer) => {
        console.log('Selected dealer:', dealer);
        navigate(`/admin-dealers/${dealer.value}`, {
            state: { id: dealer.value, name: dealer.label },
        });
    };

    // Handle recalculate all orders
    const handleRecalculateAll = async () => {
        const hide = message.loading('Recalculating orders for all dealers...', 0);
        
        try {
            setRecalculatingAll(true);
            const response = await client.post('/entries/recalculate-all-orders');
            
            hide(); // Close loading message
            
            if (response.data && response.data.success) {
                const { summary } = response.data;
                
                // Show detailed success message
                message.success({
                    content: `Successfully recalculated orders for ${summary.successful.length} out of ${summary.totalDealers} dealers`,
                    duration: 5
                });
                
                // Show failures if any
                if (summary.failed.length > 0) {
                    message.warning({
                        content: `Warning: ${summary.failed.length} dealers failed - check console for details`,
                        duration: 8
                    });
                    console.error('Failed dealers:', summary.failed);
                }
                
                // Refresh dealer list to get updated data
                await fetchDealers();
            }
        } catch (error) {
            hide(); // Close loading message
            message.error({
                content: 'Failed to recalculate orders. Please try again.',
                duration: 5
            });
            console.error('Recalculation error:', error);
        } finally {
            setRecalculatingAll(false);
        }
    };

    // Confirmation modal for recalculate all
    const confirmRecalculateAll = () => {
        if (recalculatingAll) {
            message.info('Order recalculation is already in progress');
            return;
        }
        
        Modal.confirm({
            title: 'Recalculate All Dealer Orders?',
            content: (
                <div>
                    <p>This will recalculate orders for all dealers.</p>
                    <p className="text-orange-600 font-semibold mt-2">
                        ⚠️ This may take several minutes. Please do not close this page.
                    </p>
                </div>
            ),
            okText: 'Yes, Recalculate',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: handleRecalculateAll,
            maskClosable: false,
            keyboard: false
        });
    };




    // Table columns for table view
    const columns = [
        {
            title: 'Dealer',
            dataIndex: 'label',
            key: 'label',
            render: (text, record) => (
                <div className='flex items-center space-x-3'>
                    <Avatar 
                        size={40} 
                        icon={<UserOutlined />} 
                        style={{ 
                            backgroundColor: '#F3F4F6',
                            color: '#4B5563',
                            border: '1px solid #D1D5DB'
                        }} 
                    />
                    <div>
                        <div className='font-semibold text-foreground'>{text}</div>
                        <div className='text-xs' style={{ color: '#6B7280' }}>ID: {record.value}</div>
                    </div>
                </div>
            ),
            sorter: (a, b) => a.label.localeCompare(b.label),
        },
        {
            title: 'Pending Entries',
            dataIndex: 'uncheckedCount',
            key: 'uncheckedCount',
            width: 150,
            render: (count) => {
                if (count > 0) {
                    return (
                        <Badge 
                            count={count} 
                            style={{ 
                                backgroundColor: '#EF4444',
                                color: '#FFFFFF',
                                fontWeight: '600',
                                border: '1px solid #DC2626',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '20px',
                                height: '20px',
                                lineHeight: '18px'
                            }} 
                        />
                    );
                }
                return (
                    <Tag 
                        style={{
                            backgroundColor: '#F0FDF4',
                            color: '#059669',
                            border: '1px solid #BBF7D0',
                            fontWeight: '500'
                        }}
                    >
                        Up to date
                    </Tag>
                );
            },
            sorter: (a, b) => (a.uncheckedCount || 0) - (b.uncheckedCount || 0),
        },
        {
            title: 'Overdue Amount',
            dataIndex: 'overdueAmount',
            key: 'overdueAmount',
            width: 180,
            render: (amount) => {
                const overdueAmt = parseFloat(amount) || 0;
                if (overdueAmt > 0) {
                    return (
                        <div className='flex items-center gap-2'>
                            <Tag 
                                color='error'
                                style={{
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    padding: '4px 8px'
                                }}
                            >
                                ₹{overdueAmt.toLocaleString('en-IN')}
                            </Tag>
                            <span className='text-xs text-red-600'>(&gt;30 days)</span>
                        </div>
                    );
                }
                return (
                    <Tag 
                        style={{
                            backgroundColor: '#F0FDF4',
                            color: '#059669',
                            border: '1px solid #BBF7D0',
                            fontWeight: '500'
                        }}
                    >
                        No overdue
                    </Tag>
                );
            },
            sorter: (a, b) => (parseFloat(a.overdueAmount) || 0) - (parseFloat(b.overdueAmount) || 0),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space>
                    <Tooltip title='View Details'>
                        <Button
                            type='text'
                            icon={<ArrowRightOutlined />}
                            onClick={() => handleDealerClick(record)}
                            style={{
                                color: '#6B7280',
                                border: '1px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#F9FAFB';
                                e.target.style.color = '#374151';
                                e.target.style.borderColor = '#D1D5DB';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#6B7280';
                                e.target.style.borderColor = 'transparent';
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];


    return (
        <div className='layout-container'>

            {/* Controls Section */}
            <div className='content-section mb-6'>
                <Row gutter={[16, 16]} align='middle'>
                    <Col xs={24} md={16}>
                        <Search
                            placeholder='Search dealers by name...'
                            allowClear
                            enterButton
                            size='large'
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onSearch={handleSearch}
                            prefix={<SearchOutlined />}
                            className='w-full'
                        />
                    </Col>
                    <Col xs={24} md={8} className='flex items-center justify-end gap-3'>
                        <Checkbox
                            checked={showOverdueOnly}
                            onChange={(e) => {
                                setShowOverdueOnly(e.target.checked);
                                setCurrentPage(1);
                            }}
                        >
                            Show Overdue Only
                        </Checkbox>
                    </Col>
                    <Col xs={24} md={24} className='flex items-center justify-end gap-3'>
                        <Tooltip title='Refresh dealer list'>
                            <Button 
                                icon={<SyncOutlined />} 
                                onClick={fetchDealers}
                                loading={loading}
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderColor: '#D1D5DB',
                                    color: '#374151'
                                }}
                            >
                                Refresh
                            </Button>
                        </Tooltip>
                        <Tooltip title='Recalculate orders for all dealers (may take several minutes)'>
                            <Button 
                                icon={<ReloadOutlined spin={recalculatingAll} />}
                                onClick={confirmRecalculateAll}
                                loading={recalculatingAll}
                                danger
                                style={{
                                    backgroundColor: recalculatingAll ? '#FEF2F2' : '#FFF',
                                    borderColor: '#DC2626',
                                    color: '#DC2626'
                                }}
                            >
                                Refresh All Orders
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>
            </div>

            {/* Content Section */}
            <div className='content-section'>
                <Table
                    columns={columns}
                    dataSource={allDealers}
                    rowKey='value'
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: dealersPagination?.total || 0,
                        onChange: handlePageChange,
                        onShowSizeChange: handlePageChange,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} of ${total} dealers`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onRow={(record) => ({
                        onClick: () => handleDealerClick(record),
                        style: { cursor: 'pointer' },
                        onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor = '#F9FAFB';
                        },
                        onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    })}
                    className='data-grid'
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden'
                    }}
                />
            </div>
        </div>
    );
};

export default AdminDailyEntryDealersPage;