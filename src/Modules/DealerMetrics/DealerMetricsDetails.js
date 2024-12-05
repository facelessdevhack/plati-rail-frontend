import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import AdminLayout from '../Layout/adminLayout'
import CustomTable from '../../Core/Components/CustomTable'
import { DatePicker } from 'antd'
import CustomInput from '../../Core/Components/CustomInput'
import { useLocation, useParams } from 'react-router-dom'
import { getDealerQuantity } from '../../redux/api/dashboardAPI'

const DealerMetricsDetails = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    
    const { state } = useLocation();
    const { id, name } = useParams();
    const dispatch = useDispatch()
    
    const { loggedIn, user } = useSelector((state) => state.userDetails);
    const { dealerQuantityMetrics } = useSelector(state => state.metrics)

    const isAdmin = user.roleId === 5;

    // API CALLS
    useEffect(() => {
        dispatch(getDealerQuantity({dealerId: id, page: currentPage, limit: pageSize, startDate, endDate}))
    },[dispatch, currentPage, pageSize, startDate, endDate])

    const columns = [
        {
            title: "Model",
            dataIndex: "modelName",
            key: "modelName",
            render: (text) => <div>{text || '-'}</div>,
            sorter: (a, b) => a.modelName.localeCompare(b.modelName), // String sorting
        },
        {
            title: "Size",
            dataIndex: "size",
            key: "size",
            render: (text) => <div>{text || '-'}</div>,
            sorter: (a, b) => parseFloat(a.size) - parseFloat(b.size), // Numeric sorting
        },
        {
            title: "Finish",
            dataIndex: "finish",
            key: "finish",
            render: (text) => <div>{text || '-'}</div>,
            sorter: (a, b) => a.finish.localeCompare(b.finish), // String sorting
        },
        {
            title: "PCD",
            dataIndex: "pcd",
            key: "pcd",
            render: (text) => <div>{text || '-'}</div>,
            sorter: (a, b) => parseFloat(a.pcd) - parseFloat(b.pcd), // Numeric sorting
        },
        {
            title: "Quantity",
            dataIndex: "totalQuantity",
            key: "totalQuantity",
            render: (text) => <div>{text || '-'}</div>,
            sorter: (a, b) => a.totalQuantity - b.totalQuantity, // Numeric sorting
            defaultSortOrder: 'descend', // Default to descending order
        },
    ];

    const handlePages = (page, currentPageSize) => {
        setCurrentPage(page);
        setPageSize(currentPageSize);
    }

    const handleDateChange = (dates) => {
        if (dates) {
            setStartDate(dates[0].startOf('day').toISOString());
            setEndDate(dates[1].endOf('day').toISOString());
        } else {
            setStartDate(null);
            setEndDate(null);
        }
    };


    return (
        <AdminLayout 
        title={
            <div>
                {state?.name}
            </div>
            } 
        content={
            <div className='p-5 h-full'>
                <div>
                        <div className="mt-5 flex justify-end items-center">
                            <div className='flex justify-end items-center gap-4'>
                                {/* <div onClick={showDownloadModal} className="px-3 bg-white rounded-xl p-2 shadow-lg cursor-pointer border border-gray-300 hover:border-gray-400 transition-all">
                                    <div className='flex items-center gap-x-2'>
                                        <DownloadOutlined style={{
                                            fontSize: 24,
                                            color: '#f26933', // Change color to match the theme
                                        }} />
                                        <div>Export </div>
                                    </div>
                                </div> */}
                                <DatePicker.RangePicker
                                    onChange={handleDateChange}
                                    className="rounded-xl shadow-lg border border-gray-300 hover:border-gray-400 transition-all"
                                    style={{
                                        padding: '8px 12px', // Add some padding for a better look
                                        width: '250px' // Adjust the width as needed
                                    }}
                                />
                            </div>
                        </div>
                        <CustomTable
                            isAdmin={isAdmin}
                            // editFunction={showEditModalFunction}
                            data={dealerQuantityMetrics}
                            titleOnTop={false}
                            position="bottomRight"
                            columns={columns}
                            expandable={false}
                            showSort={true}
                            // totalCount={dealerEntryCount}
                            currentPage={currentPage}
                            handlePageChange={handlePages}
                            pageSize={pageSize}
                        />
                    </div >
            </div>
        }  />
    )
}

export default DealerMetricsDetails