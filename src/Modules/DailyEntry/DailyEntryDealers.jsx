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

import React, { useEffect, useState } from "react";
import { Row, Col } from "antd";
import CustomTable from "../../Core/Components/CustomTable";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import CustomInput from "../../Core/Components/CustomInput";
import { getAllDealers } from "../../redux/api/stockAPI";

const AdminDailyEntryDealersPage = () => {
    const [activeTab, setActiveTab] = useState(1);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { allDealers } = useSelector((state) => state.stockDetails);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const { loggedIn, user } = useSelector((state) => state.userDetails);

    useEffect(() => {
        if (user.roleId === 5) {
            dispatch(getAllDealers({}));
        } else {
            console.log(user, 'USERS')
            dispatch(getAllDealers({ id: user.userId }));
        }
        console.log(allDealers, "DEALERS");
    }, [dispatch]);

    // Filter dealers based on the search query
    const filteredDealers = allDealers?.filter(dealer =>
        dealer.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            title: "Dealer Name",
            dataIndex: "label",
            key: "label",
            render: (text) => <div className="cursor-pointer">{text}</div>,
        },
        {
            title: "Unchecked Entries",
            dataIndex: "uncheckedCount",
            key: 'uncheckedCount',
            render: (text) => <div className="bg-orange-500 text-white px-3 py-1 rounded-full max-w-fit font-bold">{text}</div>
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
                    <div>
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
                            data={filteredDealers}
                            titleOnTop={false}
                            position="bottomRight"
                            columns={columns}
                            expandable={false}
                            totalCount={filteredDealers?.length}
                            currentPage={currentPage}
                            handlePageChange={setCurrentPage}
                            pageSize={pageSize}
                            onRowClick={handleRowClick}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDailyEntryDealersPage;