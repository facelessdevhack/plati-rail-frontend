import React, { useEffect, useState } from "react";
import { Row, Col } from "antd";
import CustomTable from "../../Core/Components/CustomTable";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CustomInput from "../../Core/Components/CustomInput";
import { getAllDealers } from "../../redux/api/stockAPI";

const DealersList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { allDealers, dealersPagination } = useSelector((state) => state.stockDetails);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const { user } = useSelector((state) => state.userDetails);

    useEffect(() => {
        fetchDealers();
    }, [dispatch, currentPage, pageSize, searchQuery]);

    const fetchDealers = () => {
        const params = { page: currentPage, limit: pageSize };
        if (user.roleId !== 5) {
            params.id = user.userId;
        }
        if (searchQuery) {
            params.search = searchQuery;
        }
        dispatch(getAllDealers(params));
    };

    // Handle page change
    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size !== pageSize) {
            setPageSize(size);
        }
    };

    const columns = [
        {
            title: "Dealer Name",
            dataIndex: "label",
            key: "label",
            render: (text) => <div className="cursor-pointer">{text}</div>,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (text) => <div>{text || '-'}</div>,
        },
        {
            title: "District",
            dataIndex: "district",
            key: "district",
            render: (text) => <div>{text || '-'}</div>,
        },
        {
            title: "State",
            dataIndex: "state",
            key: "state",
            render: (text) => <div>{text || '-'}</div>,
        },
        {
            title: "Unchecked Entries",
            dataIndex: "uncheckedCount",
            key: 'uncheckedCount',
            render: (text) => text ? <div className="bg-orange-500 text-white px-3 py-1 rounded-full max-w-fit font-bold">{text}</div> : <div>-</div>
        }
    ];

    // Function to handle row click
    const handleRowClick = (record) => {
        console.log(record, 'RECORD');
        navigate(`/admin-dealers/${record.value}`, {
            state: { id: record.value, name: record.label },
        });
    };

    return (
        <div className="w-full h-full p-5 bg-gray-200">
            <Row gutter={16}>
                <Col span={24}>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-4">Dealers List</h2>
                        {/* Search input */}
                        <CustomInput
                            placeholder={"Search Dealers"}
                            intent={"search"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <CustomTable
                            data={allDealers}
                            titleOnTop={false}
                            position="bottomRight"
                            columns={columns}
                            expandable={false}
                            totalCount={dealersPagination?.total || 0}
                            currentPage={currentPage}
                            handlePageChange={handlePageChange}
                            currentPageSize={pageSize}
                            onRowClick={handleRowClick}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default DealersList;