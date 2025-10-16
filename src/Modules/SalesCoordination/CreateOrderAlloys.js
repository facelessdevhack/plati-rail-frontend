import React from 'react';
import CustomSelect from '../../Core/Components/CustomSelect';
import CustomInput from '../../Core/Components/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { getDealersDropdown, getAllProducts } from '../../redux/api/stockAPI';
import Button from '../../Core/Components/CustomButton';
import {
  setEntry,
  resetEntry,
  addEntry,
  setEditing,
} from '../../redux/slices/entry.slice';
import { addCoordinatedEntryAPI, getAllCoordinationEntriesAPI } from '../../redux/api/entriesAPI';
import moment from 'moment';
import { Table, Tag, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const CreateOrderAlloys = () => {
  const dispatch = useDispatch();
  const { entry } = useSelector((state) => state.entryDetails);
  const [reloadAPI, setReloadAPI] = React.useState(false);
  const [coordinationEntries, setCoordinationEntries] = React.useState([]);
  const { dealersDropdown, allProducts } = useSelector((state) => state.stockDetails);

  const getAndSetTodayDate = () => {
    const dateToSet = moment().format('YYYY-MM-DD HH:mm:ss');
    dispatch(setEntry({ ...entry, date: dateToSet }));
  };

  const fetchCoordinationEntries = async () => {
    try {
      const response = await dispatch(getAllCoordinationEntriesAPI()).unwrap();
      // Filter for alloys (product_type === 1)
      const alloyEntries = response.entries?.filter(entry => entry.productType === 1) || [];
      setCoordinationEntries(alloyEntries);
    } catch (error) {
      console.error('Error fetching coordination entries:', error);
      message.error('Failed to load today\'s orders');
    }
  };

  React.useEffect(() => {
    dispatch(getDealersDropdown({}));
    dispatch(getAllProducts({ type: 1 }));
    fetchCoordinationEntries();
    getAndSetTodayDate();
  }, [dispatch]);

  React.useEffect(() => {
    fetchCoordinationEntries();
  }, [reloadAPI]);

  const handleCreateOrder = async () => {
    if (!entry.dealerId || !entry.dealerName) {
      message.error('Please select a dealer before submitting.');
      return;
    }

    if (!entry.productId || !entry.productName) {
      message.error('Please select a product before submitting.');
      return;
    }

    if (!entry.quantity) {
      message.error('Please enter a quantity before submitting.');
      return;
    }

    try {
      const addEntryResponse = await addCoordinatedEntryAPI({ ...entry });
      if (addEntryResponse.status === 200) {
        console.log(addEntryResponse, 'addEntryResponse');
        const responseData = addEntryResponse.data;

        // Show routing information to user
        if (responseData.routedTo === 'dispatch_entries') {
          message.success('✅ Order created successfully! Stock available. Sent to dispatch queue.');
        } else if (responseData.routedTo === 'currently_inprod_master') {
          message.info('🔄 Order created! Product is currently in production.');
        } else if (responseData.routedTo === 'pending_entry_master') {
          message.warning('⏳ Order pending. Product is out of stock and not in production.');
        } else {
          message.success('Order created successfully!');
        }

        dispatch(resetEntry());
        getAndSetTodayDate();
        setReloadAPI(!reloadAPI);
      }
    } catch (error) {
      console.log(error, 'error');
      message.error('Error creating order. Please try again.');
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Dealer',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 200,
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'entryStatus',
      key: 'entryStatus',
      width: 150,
      render: (status, record) => {
        const statusConfig = {
          dispatch: { color: 'processing', label: record.statusLabel || 'Awaiting Dispatch' },
          pending: { color: 'warning', label: record.statusLabel || 'Out of Stock' },
          in_production: { color: 'cyan', label: record.statusLabel || 'In Production' },
        };
        const config = statusConfig[status] || { color: 'default', label: 'Unknown' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
  ];

  return (
    <div className="grid h-[calc(100vh-135px)] grid-cols-6 gap-4 p-5">
      {/* Left Panel - Create Order Form */}
      <div className="h-full col-span-2 p-5 bg-white border-2 rounded-lg shadow-sm">
        <div className="pb-5 text-2xl font-bold text-center text-gray-800">
          Create Alloys Order
        </div>
        <div className="grid w-full grid-cols-1 gap-5">
          <div>
            <div className="mb-2 font-medium">Date & Time</div>
            <CustomInput
              type="datetime-local"
              value={entry?.date}
              onChange={(e) =>
                dispatch(
                  setEntry({
                    date: e.target.value,
                  })
                )
              }
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Select Dealer</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={dealersDropdown || []}
              value={entry.dealerId}
              placeholder="Select a dealer"
              onChange={(e, l) => {
                dispatch(
                  setEntry({
                    dealerId: e,
                    dealerName: l ? l.label : null,
                  })
                );
              }}
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Select Product</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allProducts}
              value={entry.productId}
              placeholder="Select a product"
              onChange={(e, l) => {
                dispatch(
                  setEntry({
                    productId: e,
                    productName: l ? l.label : null,
                    productType: 1, // Alloys
                  })
                );
              }}
            />
          </div>
          <div>
            <div className="mb-2 font-medium">Quantity</div>
            <CustomInput
              type="number"
              value={entry.quantity}
              onChange={(e) =>
                dispatch(
                  setEntry({
                    quantity: +e.target.value,
                  })
                )
              }
              placeholder="Enter quantity"
            />
          </div>
          <div className="flex gap-3 mt-5">
            <Button
              onClick={handleCreateOrder}
              className="w-full"
              type="primary"
            >
              Create Order
            </Button>
            <Button
              onClick={() => {
                dispatch(resetEntry());
                getAndSetTodayDate();
              }}
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Today's Orders */}
      <div className="h-full col-span-4 p-5 overflow-auto bg-white border-2 rounded-lg shadow-sm">
        <div className="pb-5 text-2xl font-bold text-center text-gray-800">
          Today's Orders
        </div>
        <Table
          columns={columns}
          dataSource={coordinationEntries}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
          scroll={{ y: 'calc(100vh - 300px)' }}
        />
      </div>
    </div>
  );
};

export default CreateOrderAlloys;
