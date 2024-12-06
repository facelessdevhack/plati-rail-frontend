import React, { useEffect, useState } from "react";
import { Row, Col, Flex, Segmented, DatePicker, Modal, Spin, message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DownloadOutlined } from "@ant-design/icons";
import CustomTable from "../../../Core/Components/CustomTable";
import CustomInput from "../../../Core/Components/CustomInput";
import { checkEntry, editEntryAPI, getAdminPaymentMethods, getAllEntriesAdmin, getAllPaymentMethods, getMiddleDealers, getPaymentEntries, getPaymentMethods } from "../../../redux/api/entriesAPI";
import AdminLayout from "../../Layout/adminLayout";
import Button from "../../../Core/Components/CustomButton";
import { updateChargesEntryById, updateDealerEntryById, updatePaymentEntryById } from "../../../redux/slices/entry.slice";
import { client } from "../../../Utils/axiosClient";
import moment from "moment";
import CustomSelect from "../../../Core/Components/CustomSelect";
import { getAllProducts } from "../../../redux/api/stockAPI";

const AdminDealerDetails = () => {
    const [activeTab, setActiveTab] = useState(1);
    const [dealerInfo, setDealerInfo] = useState(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [isModalVisible, setIsModalVisible] = useState(false); // State to manage modal visibility
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [checkedEntry, setCheckedEntry] = useState(false)
    const [cashAmount, setCashAmount] = useState(null)
    const today = moment().format('YYYY-MM-DD')
    const [entryDate, setEntryDate] = useState(today)
    const [description, setDescription] = useState('CASH')
    const [paymentMethod, setPaymentMethod] = useState(6)
    const [middleDealerId, setMiddleDealerId] = useState(null)
    const [loader, setLoader] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)
    const { loggedIn, user } = useSelector((state) => state.userDetails);



    const navigate = useNavigate();
    const { state } = useLocation();
    const { id, name } = useParams();
    const dispatch = useDispatch();
    const { allDealerEntries, allPMEntries, pmEntryCount, dealerEntryCount, spinLoader, allMiddleDealers, adminPaymentMethods, allAdminPaymentMethods } = useSelector((state) => state.entryDetails);
    const { allProducts } = useSelector(
        (state) => state.stockDetails,
    );

    const ROLE_ADMIN = 5

    const isAdmin = user.roleId === ROLE_ADMIN;

    const getDealerInfo = async () => {
        try {
            const result = await client.get(`/master/dealer-info?id=${id}`)
            if (result) {
                console.log(result.data)
                setDealerInfo(result.data?.[0])
            }
        } catch (e) {
            console.log(e, 'ERROR OF DEALER INFO')
        }
    }

    useEffect(() => {
        dispatch(getAllEntriesAdmin({ dealerId: id, page: currentPage, limit: pageSize, startDate, endDate, sortField, sortOrder }));
        dispatch(getPaymentEntries({ dealerId: id, page: currentPage, limit: pageSize, startDate, endDate, sortField, sortOrder }));
        dispatch(getMiddleDealers({}))
        dispatch(getAdminPaymentMethods({}))
        dispatch(getAllPaymentMethods({}))
        getDealerInfo()
        dispatch(getAllProducts({}));
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

    // Check Purchase Entry Function for Entries
    const handleCheckPurchaseEntry = async (entryId) => {
        try {
            setLoader(true)
            const checkEntryResponse = await client.post(`/entries/check-purchase-entry`, {
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
            setLoader(true)
            const checkEntryResponse = await client.post(`/entries/check-payment-entry`, {
                entryId
            });
            if (checkEntryResponse) {
                console.log(checkEntryResponse, "CHECK ENTRY RESPONSE");
                dispatch(updatePaymentEntryById({ entryId, checked: 1 }));
                setCheckedEntry(!checkedEntry)
                setLoader(false)
            }
        } catch (e) {
            setLoader(false)
            console.log(e, "CHECK ENTRY ERROR");
        }
    }
    // Check Entry Function for Charges
    const handleCheckChargesEntry = async (entryId) => {
        try {
            setLoader(true)
            const checkEntryResponse = await client.post(`/entries/check-charges-entry`, {
                entryId
            });
            if (checkEntryResponse) {
                console.log(checkEntryResponse, "CHECK ENTRY RESPONSE");
                dispatch(updateChargesEntryById({ entryId, checked: 1 }));
                setCheckedEntry(!checkedEntry)
                setLoader(false)
            }
        } catch (e) {
            setLoader(false)
            console.log(e, "CHECK ENTRY ERROR");
        }
    }

    const handleDownloadReport = async ({ dealerId, dealerName, startDate, endDate }) => {
        try {
            setLoader(true)
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
            setLoader(false)
            return response.data; // Return the response data if needed for further processing
        } catch (error) {
            setLoader(false)
            console.log(error, 'error');
            return error;
        }
    };

    const handleAddPMEntry = async ({ amount, paymentDate }) => {
        try {
            setLoader(true)
            const response = await client.post('entries/create-pm-entry', {
                dealerId: id,
                dealerName: state?.name,
                description: description,
                amount,
                paymentMethod: paymentMethod,
                middleDealerId,
                payment_date: paymentDate
            });
            if (response) {
                setMiddleDealerId(null)
                setCashAmount(null)
                setEntryDate(today)
                setLoader(false)
                setPaymentMethod(6)
                setDescription('CASH')
                setCheckedEntry(!checkedEntry)
            }
            return response.data;
        } catch (e) {
            setLoader(false)
            console.log(e, 'ERROR');
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

    const showPaymentModalFunction = () => {
        setShowPaymentModal(true);
    };

    const handlePaymentModalOk = async () => {
        await handleAddPMEntry({
            amount: cashAmount,
            paymentDate: entryDate
        })
        setShowPaymentModal(false);
        setCashAmount(null)
        setEntryDate(today)
        setDescription('CASH')
        setPaymentMethod(6)
        setMiddleDealerId(null)
    };

    const handlePaymentModalCancel = () => {
        setShowPaymentModal(false);
        setCashAmount(null)
        setEntryDate(today)
        setDescription('CASH')
        setPaymentMethod(6)
        setMiddleDealerId(null)
    };

    // Model and Functions for Editing Entry
    const showEditModalFunction = (data) => {
        setEditingEntry(data)
        setShowEditModal(true);
    };

    const handleEditModalOk = async () => {
        const finalEditingEntry = editingEntry.id === undefined ? { ...editingEntry, id: editingEntry?.inwardsEntryId || editingEntry.entryId } : editingEntry
        try {
            setLoader(true)
            const editEntryResponse = await editEntryAPI(finalEditingEntry)
            if (editEntryResponse) {
                setCheckedEntry(!checkedEntry)
                console.log(editEntryResponse, 'editEntryResponse');
                setLoader(false)
                setShowEditModal(false);

            } else {
                message.error('Unable to edit entry')
            }
        } catch (e) {
            message.info('Unable to edit entry')
            setLoader(false)
            setShowEditModal(false);
        }
    };

    const handleEditModalCancel = () => {
        setEditingEntry(null)
        setShowEditModal(false);
    };


    const getPaymentMethodLabel = (methodId) => {
        console.log(methodId, 'METHOD ID')
        const method = allAdminPaymentMethods.find((method) => method.id === methodId);
        return method ? method.methodName : 'Unknown Method';
    };

    const formatINR = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getBalanceColor = (value) => {
        if (value === null || value === undefined) return '';
        return value < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
    };

    // Columns for Entries
    const columns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (text) => <div>{moment(text).format('DD/MM/YYYY') || '-'}</div>,
        },
        {
            title: "Product Name",
            dataIndex: "productName",
            key: "productName",
            render: (text) => <div>{text || '-'}</div>,
        },
        {
            title: <div className="flex justify-center items-center">Quantity</div>,
            dataIndex: "quantity",
            key: "quantity",
            render: (text) => <div className="flex justify-center items-center">{text || '-'}</div>,
        },
        {
            title: <div className="flex justify-center items-center">Amount</div>,
            dataIndex: "price",
            key: "price",
            render: (text, record) => (
                <div className="flex justify-center items-center">
                    <div>
                        {record.isClaim === 1 ? "Claimed" : formatINR(text)}
                    </div>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "paymentStatus",
            key: "paymentStatus",
            render: (text) => <div>{text === 1 ? "Pending" : text === 2 ? "Partial" : text === 3 ? "Paid" : "Failed"}</div>,
        },
        {
            title: "Entry Type",
            dataIndex: "source",
            key: "source",
            render: (text) => <div>{text || '-'}</div>,
        },
        {
            title: "Balance After Entry",
            dataIndex: "currentBal",
            key: "currentBal",
            render: (value, record) => (
                <div>
                    {value !== null && value !== undefined
                        ? <span className={getBalanceColor(record?.entryCurrentBal || value)}>
                            {formatINR(record?.entryCurrentBal || value)}
                        </span>
                        : '₹0'}
                </div>
            ),
        },
        // Conditionally include the "Checked" column
        // ...(isAdmin
        //     ? [
        //         {
        //             title: "Checked",
        //             dataIndex: "isChecked",
        //             key: "isChecked",
        //             render: (text, record) => (
        //                 <Button size='slim' padding='slim' onClick={() => {
        //                     record.source === "Purchase" ? handleCheckPurchaseEntry(record.entryId) : handleCheckEntry(record.entryId)
        //                 }}>
        //                     <div>{text === 1 ? "Checked" : "Unchecked"}</div>
        //                 </Button>
        //             ),
        //         },
        //     ]
        //     : []),
        ...(isAdmin
            ? [
                {
                    title: "Checked",
                    dataIndex: "isChecked",
                    key: "isChecked",
                    render: (text, record) => (
                        <Button
                            size="slim"
                            padding="slim"
                            onClick={() => {
                                if (record.source === "Purchase") {
                                    handleCheckPurchaseEntry(record.entryId);
                                } else if (record.sourceType === 4) {
                                    handleCheckChargesEntry(record.entryId);
                                } else {
                                    handleCheckEntry(record.entryId);
                                }
                            }}
                        >
                            <div>{text === 1 ? "Checked" : "Unchecked"}</div>
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
            dataIndex: "paymentDate",
            key: "paymentDate",
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
            render: (text) => <div className="flex justify-between items-center">{formatINR(text)}</div>,
        },
        {
            title: "Mode of Payment",
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            render: (text, record) => <div>{getPaymentMethodLabel(text)}</div>
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
            render: (value, record) => (
                <div>
                    {value !== null && value !== undefined
                        ? <span className={getBalanceColor(record.entryCurrentBal || value)}>
                            {formatINR(record.entryCurrentBal || value)}
                        </span>
                        : '₹0'}
                </div>
            ),
        },
        ...(isAdmin
            ? [
                {
                    title: "Checked",
                    dataIndex: "isPaid",
                    key: "isPaid",
                    render: (text, record) => (
                        <Button size='slim' padding='slim' onClick={() => handleCheckPaymentEntry(record.id)}>
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

    const handlePages = (page, currentPageSize) => {
        setCurrentPage(page);
        setPageSize(currentPageSize);
    }

    const handleOrderDashboard = () => {
        console.log(id, 'RECORD');
        navigate(`/admin-orders-dashboard/${id}`, {
            state: { id: id },
        });
    };




    // Handle Tab Content Render
    const handleTabContentRender = () => {
        switch (activeTab) {
            case 1:
                const sortedFilteredDealers = [...filteredDealers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
                             {/* {isAdmin && ( */}
                                    <div onClick={handleOrderDashboard} className="px-3 bg-white rounded-xl p-2 shadow-lg cursor-pointer border border-gray-300 hover:border-gray-400 transition-all">
                                        <div className='flex items-center gap-x-2'>
                                            <div>Check Orders</div>
                                        </div>
                                    </div>
                                {/* )} */}
                                {isAdmin && (
                                    <div onClick={showPaymentModalFunction} className="px-3 bg-white rounded-xl p-2 shadow-lg cursor-pointer border border-gray-300 hover:border-gray-400 transition-all">
                                        <div className='flex items-center gap-x-2'>
                                            <div>Add Payment</div>
                                        </div>
                                    </div>
                                )}
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
                            isAdmin={isAdmin}
                            editFunction={showEditModalFunction}
                            data={sortedFilteredDealers}
                            titleOnTop={false}
                            position="bottomRight"
                            columns={columns}
                            expandable={false}
                            totalCount={dealerEntryCount}
                            currentPage={currentPage}
                            handlePageChange={handlePages}
                            pageSize={pageSize}
                        />
                    </div >
                );
            case 2:
                const sortedFilteredPayments = [...filteredPayments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                return (
                    <div>
                        {/* <div className="mt-5 -mb-5">
                            <CustomInput
                                placeholder={"Search Entries"}
                                intent={"search"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <DatePicker.RangePicker onChange={handleDateChange} />
                        </div> */}

                        <div className="mt-5 flex justify-between items-center">
                            <CustomInput
                                placeholder={"Search Entries"}
                                intent={"search"}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className='flex justify-end items-center gap-4'>
                                {isAdmin && (
                                    <div onClick={showPaymentModalFunction} className="px-3 bg-white rounded-xl p-2 shadow-lg cursor-pointer border border-gray-300 hover:border-gray-400 transition-all">
                                        <div className='flex items-center gap-x-2'>
                                            <div>Add Payment</div>
                                        </div>
                                    </div>
                                )}
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
                            isAdmin={isAdmin}
                            editFunction={showEditModalFunction}
                            data={sortedFilteredPayments}
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
                return null
        }
    };

    // Determine the color class based on the balance


    return (
        <AdminLayout title={isAdmin ?
            <div>
                {state?.name}
                <div className="text-sm text-gray-700 font-semibold">
                    {dealerInfo?.currentBal !== null && dealerInfo?.currentBal !== undefined
                        && <div className="text-sm text-gray-700 font-semibold">
                            <div>
                                Current Balance -{' '}
                                {dealerInfo?.currentBal !== null && dealerInfo?.currentBal !== undefined ? (
                                    <span className={getBalanceColor(dealerInfo?.currentBal)}>
                                        {formatINR(dealerInfo?.currentBal)}
                                    </span>
                                ) : (
                                    'N/A'
                                )}
                            </div>
                        </div>
                    }
                </div>
            </div> : state?.name} content={
                <div className="w-full h-full p-5 bg-gray-200">
                    <div>
                        {loader || spinLoader && <Spin size='large' spinning={loader || spinLoader} fullscreen={true} className="z-20" ></Spin>}
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

                        {/* Modal for Adding Payment Entry */}
                        <Modal
                            title={`Add Payment Entry For ${state?.name}`}
                            open={showPaymentModal}
                            onOk={handlePaymentModalOk}
                            onCancel={handlePaymentModalCancel}
                            footer={
                                <div className='flex justify-end items-center gap-4'>
                                    <Button key="back" onClick={handlePaymentModalCancel}>
                                        Cancel
                                    </Button>
                                    <Button key="submit" type="primary" onClick={handlePaymentModalOk}>
                                        Create Entry
                                    </Button>
                                </div>
                            }
                        >
                            <div>
                                {loader && <Spin size='large' spinning={loader} fullscreen={true} className="z-20" ></Spin>}
                                <div>
                                    <div>Enter Description</div>
                                    <CustomInput
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div>Enter Amount</div>
                                    <CustomInput
                                        type="number"
                                        value={cashAmount}
                                        onChange={(e) => setCashAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div>Payment Date</div>
                                    <CustomInput
                                        type="date"
                                        value={entryDate}
                                        onChange={(e) => {
                                            setEntryDate(e.target.value)
                                            console.log(e.target.value, 'PAYMENT DATE')
                                        }
                                        }
                                    />
                                </div>
                                <div>
                                    <div>Select Mid-Dealer</div>
                                    <CustomSelect
                                        showSearch={true}
                                        className="w-full"
                                        options={allMiddleDealers}
                                        value={middleDealerId}
                                        onChange={(e, l) => setMiddleDealerId(e)}
                                    />
                                </div>
                                <div>
                                    <div>Payment Method</div>
                                    <div className='flex justify-start'>
                                        {adminPaymentMethods?.map((method) => (
                                            <label key={method} className="mr-4 flex justify-start gap-x-2">
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method.id}
                                                    checked={paymentMethod === method.id}
                                                    onChange={() =>
                                                        setPaymentMethod(method.id)
                                                    }
                                                />
                                                {method.methodName}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Modal>

                        {/* Modal for Editing Entry */}
                        <Modal
                            title={`Edit Entry`}
                            open={showEditModal}
                            onOk={handleEditModalOk}
                            onCancel={handleEditModalCancel}
                            footer={
                                <div className='flex justify-end items-center gap-4'>
                                    <Button key="back" onClick={handleEditModalCancel}>
                                        Cancel
                                    </Button>
                                    <Button key="submit" type="primary" onClick={handleEditModalOk}>
                                        Edit Entry
                                    </Button>
                                </div>
                            }
                        >
                            <div>
                                {loader && <Spin size='large' spinning={loader} fullscreen={true} className="z-20" ></Spin>}
                                {editingEntry && editingEntry.sourceType === 2 ? (
                                    <div className="flex flex-col gap-y-2">
                                        <div>
                                            <div>Change Description</div>
                                            <CustomInput
                                                value={editingEntry?.description}
                                                onChange={(e) => {
                                                    setEditingEntry({ ...editingEntry, description: e.target.value })
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div>Change Pricing</div>
                                            <CustomInput
                                                value={editingEntry?.sourceType === 2 ? editingEntry?.amount : editingEntry?.price}
                                                onChange={(e) => {
                                                    if (editingEntry?.sourceType === 2) {
                                                        setEditingEntry({ ...editingEntry, amount: e.target.value })
                                                    } else {
                                                        setEditingEntry({ ...editingEntry, price: e.target.value })
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-y-2">
                                        <div>
                                            <div>Select Product</div>
                                            <CustomSelect
                                                showSearch={true}
                                                className="w-full"
                                                options={allProducts}
                                                value={editingEntry?.productId}
                                                onChange={(e, l) => {
                                                    setEditingEntry({
                                                        ...editingEntry,
                                                        productId: e,
                                                        productName: l ? l.label : null,
                                                    })
                                                }
                                                }
                                            />
                                        </div>
                                        <div>
                                            <div>Change Quantity</div>
                                            <CustomInput
                                                value={editingEntry?.quantity}
                                                onChange={(e) => {
                                                    setEditingEntry({ ...editingEntry, quantity: e.target.value })
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div>Change Pricing</div>
                                            <CustomInput
                                                value={editingEntry?.sourceType === 2 ? editingEntry?.amount : editingEntry?.price}
                                                onChange={(e) => {
                                                    if (editingEntry?.sourceType === 2) {
                                                        setEditingEntry({ ...editingEntry, amount: e.target.value })
                                                    } else {
                                                        setEditingEntry({ ...editingEntry, price: e.target.value })
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Modal>
                    </div>
                </div >
            } />
    );
};

export default AdminDealerDetails;