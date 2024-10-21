import React, { useEffect, useState } from "react";
import { Row, Col, Flex, Segmented, DatePicker, Modal, Spin } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DownloadOutlined } from "@ant-design/icons";
import CustomTable from "../../../Core/Components/CustomTable";
import CustomInput from "../../../Core/Components/CustomInput";
import { checkEntry, getAllEntriesAdmin, getPaymentEntries } from "../../../redux/api/entriesAPI";
import AdminLayout from "../../Layout/adminLayout";
import Button from "../../../Core/Components/CustomButton";
import { updateDealerEntryById } from "../../../redux/slices/entry.slice";
import { client } from "../../../Utils/axiosClient";
import moment from "moment";

const AdminDealerDetails = () => {
    const [activeTab, setActiveTab] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [isModalVisible, setIsModalVisible] = useState(false); // State to manage modal visibility
    const [checkedEntry, setCheckedEntry] = useState(false)
    const [loader, setLoader] = useState(false)
    const { loggedIn, user } = useSelector((state) => state.userDetails);



    const navigate = useNavigate();
    const { state } = useLocation();
    const { id, name } = useParams();
    const dispatch = useDispatch();
    const { allDealerEntries, allPMEntries, pmEntryCount, dealerEntryCount, spinLoader } = useSelector((state) => state.entryDetails);

    const ROLE_ADMIN = 5

    const isAdmin = user.roleId === ROLE_ADMIN;

    useEffect(() => {
        dispatch(getAllEntriesAdmin({ dealerId: id, page: currentPage, limit: pageSize, startDate, endDate, sortField, sortOrder }));
        dispatch(getPaymentEntries({ dealerId: id, page: currentPage, limit: pageSize, startDate, endDate, sortField, sortOrder }));
    }, [dispatch, currentPage, pageSize, startDate, endDate, sortField, sortOrder, checkedEntry]);

    // Filter dealers based on the search query
    const filteredDealers = allDealerEntries?.filter(entry =>
        entry?.productName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter payments based on the search query
    const filteredPayments = allPMEntries?.filter(entry =>
        entry?.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Check Entry Function for Entries
    const handleCheckEntry = async (entryId) => {
        try {
            setLoader(true)
            const checkEntryResponse = await client.post(`/entries/check-entry`, {
                entryId
            });
            if (checkEntryResponse) {
                console.log(checkEntryResponse, "CHECK ENTRY RESPONSE");
                dispatch(updateDealerEntryById({ entryId, checked: 1 }));
                setCheckedEntry(!checkedEntry)
                setLoader(false)
            }
        } catch (e) {
            setLoader(false)
            console.log(e, "CHECK ENTRY ERROR");
        }
    }

    // Check Entry Function for Payments
    const handleCheckPaymentEntry = async (entryId) => {
        try {
            const checkEntryResponse = await client.post(`/entries/check-entry`, {
                entryId
            });
            if (checkEntryResponse) {
                console.log(checkEntryResponse, "CHECK ENTRY RESPONSE");
                dispatch(updateDealerEntryById({ entryId, checked: 1 }));
            }
        } catch (e) {
            console.log(e, "CHECK ENTRY ERROR");
        }
    }

    const handleDownloadReport = async ({ dealerId, dealerName, startDate, endDate }) => {
        try {
            const response = await client.post('/export/export-entries', {
                dealerId: +dealerId,
                dealerName,
                startDate,
                endDate,
            }, {
                responseType: 'blob', // Important for downloading files
            });

            // Create a blob URL for the downloaded file
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Format the file name
            const formattedStartDate = moment(startDate);
            const formattedEndDate = moment(endDate);

            let fileName;

            if (formattedStartDate.isValid() && formattedEndDate.isValid()) {
                // Both dates are valid
                const startDateFormatted = formattedStartDate.format('DD-MM-YYYY'); // Adjust format as needed
                const endDateFormatted = formattedEndDate.format('DD-MM-YYYY'); // Adjust format as needed
                fileName = `${dealerName} (${startDateFormatted} - ${endDateFormatted}).pdf`;
            } else {
                // Use only dealer name if any date is invalid
                fileName = `${dealerName}.pdf`;
            }

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName); // Use the dynamic file name
            document.body.appendChild(link);
            link.click();
            link.remove();

            return response.data; // Return the response data if needed for further processing
        } catch (error) {
            console.log(error, 'error');
            return error;
        }
    };

    const showDownloadModal = () => {
        setIsModalVisible(true);
    };

    const handleModalOk = async () => {
        // Call your download logic here
        await handleDownloadReport({ dealerId: id, dealerName: state?.name, startDate, endDate });
        setIsModalVisible(false);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
    };




    // Columns for Entries
    const columns = [
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => <div>{moment(text).format('DD/MM/YYYY')}</div>,
        },
        {
            title: "Product Name",
            dataIndex: "productName",
            key: "productName",
            render: (text) => <div>{text}</div>,
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: "quantity",
            render: (text) => <div>{text}</div>,
        },
        {
            title: "Amount",
            dataIndex: "price",
            key: "price",
            render: (text, record) => (
                <div>{record.isClaim === 1 ? "Claimed" : text}</div>
            ),
        },
        {
            title: "Transportation Charges",
            dataIndex: "transportationCharges",
            key: "transportationCharges",
            render: (text) => <div>{text}</div>,
        },
        {
            title: "Balance After Entry",
            dataIndex: "currentBal",
            key: "currentBal",
            render: (text) => <div>{text}</div>,
        },
        // Conditionally include the "Checked" column
        ...(isAdmin
            ? [
                {
                    title: "Checked",
                    dataIndex: "isChecked",
                    key: "isChecked",
                    render: (text, record) => (
                        <Button onClick={() => handleCheckEntry(record.entryId)}>
                            {text === 1 ? "Checked" : "Unchecked"}
                        </Button>
                    ),
                },
            ]
            : []),
    ];
    // Columns for Payments
    const paymentColumns = [
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => <div>{moment(text).format('DD/MM/YYYY')}</div>,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => <div>{text}</div>,
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (text) => <div>{text}</div>,
        },
        {
            title: "Mode of Payment",
            dataIndex: "isCheque",
            key: "isCheque",
            render: (text, record) => {
                if (record.isCheque === 1) {
                    return <div>Cheque</div>;
                } else if (record.isNeft === 1) {
                    return <div>NEFT</div>;
                } else {
                    return <div>N/A</div>;
                }
            },
        },
        {
            title: "Transportation Charges",
            dataIndex: "transportationCharges",
            key: "transportationCharges",
            render: (text) => <div>{text}</div>,
        },
        {
            title: "Balance After Entry",
            dataIndex: "currentBal",
            key: "currentBal",
            render: (text) => <div>{text}</div>,
        },
        ...(isAdmin
            ? [
                {
                    title: "Checked",
                    dataIndex: "isChecked",
                    key: "isChecked",
                    render: (text, record) => (
                        <Button onClick={() => handleCheckEntry(record.entryId)}>
                            {text === 1 ? "Checked" : "Unchecked"}
                        </Button>
                    ),
                },
            ]
            : []),
    ];

    const handleDateChange = (dates) => {
        if (dates) {
            setStartDate(dates[0].startOf('day').toISOString());
            setEndDate(dates[1].endOf('day').toISOString());
        } else {
            setStartDate(null);
            setEndDate(null);
        }
    };



    // Handle Tab Content Render
    const handleTabContentRender = () => {
        switch (activeTab) {
            case 1:
                return (
                    <div>
                        <div className="mt-5 flex justify-between items-center">
                            <CustomInput
                                placeholder={"Search Entries"}
                                intent={"search"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className='flex justify-end items-center gap-4'>
                                <div onClick={showDownloadModal} className="px-3 bg-white rounded-xl p-2 shadow-lg cursor-pointer border border-gray-300 hover:border-gray-400 transition-all">
                                    <div className='flex items-center gap-x-2'>
                                        <DownloadOutlined style={{
                                            fontSize: 24,
                                            color: '#f26933', // Change color to match the theme
                                        }} />
                                        <div>Export </div>
                                    </div>
                                </div>
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
                            data={filteredDealers}
                            titleOnTop={false}
                            position="bottomRight"
                            columns={columns}
                            expandable={false}
                            totalCount={dealerEntryCount}
                            currentPage={currentPage}
                            handlePageChange={setCurrentPage}
                            pageSize={pageSize}
                        />
                    </div >
                );
            case 2:
                return (
                    <div>
                        <div className="mt-5 -mb-5">
                            <CustomInput
                                placeholder={"Search Entries"}
                                intent={"search"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <DatePicker.RangePicker onChange={handleDateChange} />
                        </div>
                        <CustomTable
                            data={filteredPayments}
                            titleOnTop={false}
                            position="bottomRight"
                            columns={paymentColumns}
                            expandable={false}
                            totalCount={pmEntryCount}
                            currentPage={currentPage}
                            handlePageChange={setCurrentPage}
                            pageSize={pageSize}
                        />
                    </div>
                );
            default:
                return (
                    <div>
                        <div className="mt-5 -mb-5">
                            <CustomInput
                                placeholder={"Search Entries"}
                                intent={"search"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            <select onChange={(e) => setSortField(e.target.value)}>
                                <option value="created_at">Date</option>
                                <option value="productName">Product Name</option>
                                {/* Add more sorting options as needed */}
                            </select>
                            <select onChange={(e) => setSortOrder(e.target.value)}>
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
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
                        />
                    </div>
                );
        }
    };

    return (
        <AdminLayout title={state?.name} content={
            <div className="w-full h-full p-5 bg-gray-200">
                <div>
                    {loader || spinLoader && <Spin size='large' spinning={loader || spinLoader} fullscreen={true} ></Spin>}
                    <Row gutter={16}>
                        <Col span={24}>
                            <div className="flex items-baseline justify-between w-full ">
                                <Flex gap="small" align="flex-start" vertical className="shadow-lg">
                                    <Segmented
                                        onChange={setActiveTab}
                                        options={[
                                            {
                                                label: (
                                                    <div
                                                        style={{
                                                            padding: 4,
                                                        }}
                                                        className={`flex items-center justify-between gap-x-1 ${activeTab === 1 ? "font-semibold" : "font-medium"
                                                            }`}
                                                    >
                                                        <div>Entries</div>
                                                        <div>({dealerEntryCount})</div>
                                                    </div>
                                                ),
                                                value: 1,
                                            },
                                            {
                                                label: (
                                                    <div
                                                        style={{
                                                            padding: 4,
                                                        }}
                                                        className={`flex items-center justify-between gap-x-1 ${activeTab === 2 ? "font-semibold" : "font-medium"
                                                            }`}
                                                    >
                                                        <div>Payments</div>
                                                        <div>({pmEntryCount})</div>
                                                    </div>
                                                ),
                                                value: 2,
                                            },
                                        ]}
                                    />
                                </Flex>
                            </div>
                            <div>
                                {handleTabContentRender()}
                            </div>
                        </Col>
                    </Row>

                    {/* Modal for downloading report */}
                    <Modal
                        title={`Download Report for ${state?.name}`}
                        open={isModalVisible}
                        onOk={handleModalOk}
                        onCancel={handleModalCancel}
                        footer={
                            <div className='flex justify-end items-center gap-4'>
                                <Button key="back" onClick={handleModalCancel}>
                                    Cancel
                                </Button>
                                <Button key="submit" type="primary" onClick={handleModalOk}>
                                    Download
                                </Button>
                            </div>
                        }
                    >
                        <div>
                            <p className='mt-5 mb-3 italic text-xs'>*Please select the start and end date to export the data for specific dates.</p>
                            <DatePicker.RangePicker
                                onChange={handleDateChange}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </Modal>
                </div>
            </div >
        } />
    );
};

export default AdminDealerDetails;