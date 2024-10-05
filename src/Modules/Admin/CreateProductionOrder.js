import React, { useEffect, useState } from "react";
import { Tag, Space, Col, Row, Divider } from "antd";
import { Link } from "react-router-dom";
import CustomTable from "../../Core/Components/CustomTable";
import Button from "../../Core/Components/CustomButton";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllAlloys,
  getAllAlloysWithSameParams,
  getAllFinishes,
} from "../../redux/api/stockAPI";
import { updateOrderKey } from "../../redux/slices/order.slice";
import CustomModal from "../../Core/Components/CustomModal";
import CustomInput from "../../Core/Components/CustomInput";
import CustomSelect from "../../Core/Components/CustomSelect";

const CreateProductionOrder = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentData, setCurrentData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [convertToFinish, setConvertToFinish] = useState("");

  const { allAlloys, totalAlloysCount, allFinishes } = useSelector(
    (state) => state.stockDetails
  );
  const { currentOrder } = useSelector((state) => state.orderDetails);

  useEffect(() => {
    dispatch(getAllAlloys({ page: currentPage, limit: pageSize }));
  }, [currentPage, pageSize]);

  useEffect(() => {
    dispatch(getAllFinishes({}));
  }, []);

  // FUNCTIONS
  const handleAddToOrder = () => {
    // Check if currentData.modalId already exists in currentOrder
    // console.log(currentData.modalId, "mODAL");
    const modalIdExists = currentOrder.some(
      (item) => item.modelId === currentData.modelId
    );

    const modifiedData = {
      ...currentData,
      convertToId: convertToFinish,
    };
    console.log(modifiedData, "CURRENT DATA");

    if (!modalIdExists) {
      // If currentData.modalId doesn't already exist, add it to currentOrder
      dispatch(
        updateOrderKey({
          key: "currentOrder",
          value: [...currentOrder, modifiedData],
        })
      );
    }

    // Reset currentData and close the modal
    setCurrentData({});
    setIsModalOpen(false);
  };

  const removeFromOrder = (modalIdToRemove) => {
    // Filter out the item with the specified modalId
    const newOrder = currentOrder.filter(
      (item) => item.modelId !== modalIdToRemove
    );

    // Dispatch action to update the order with the new array
    dispatch(
      updateOrderKey({
        key: "currentOrder",
        value: newOrder,
      })
    );
  };

  const columns = [
    {
      title: "Inches",
      dataIndex: "inches",
      key: "inches",
      render: (text) => <div>{text}"</div>,
    },
    {
      title: "PCD",
      dataIndex: "pcd",
      key: "pcd",
      render: (text, record) => (
        <div>
          {text}
          {record?.holes ? "x" + record?.holes : null}
        </div>
      ),
    },
  ];

  const expandedData = [
    {
      title: "Model",
      dataIndex: "modelName",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "CB",
      dataIndex: "cb",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "Finish",
      dataIndex: "finish",
      render: (text) => <div>{text}</div>,
    },
    {
      title: "IH-Stock",
      dataIndex: "inHouseStock",
      render: (text) => <div>{text} pcs</div>,
    },
    {
      title: "SW-Stock",
      dataIndex: "showroomStock",
      render: (text) => <div>{text} pcs</div>,
    },
    {
      title: "Order",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button
            onClick={() => {
              setCurrentData(record);
              console.log(record, "RECORD");
              dispatch(
                getAllAlloysWithSameParams({
                  pcdId: record.pcdId,
                  modelId: record.modelId,
                  cbId: record.cb,
                  finishId: record.finishId,
                  holesId: record.holesId,
                  inchesId: record.inchesId,
                  widthId: record.width,
                })
              );
              setIsModalOpen(true);
            }}
          >
            Add
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Row>
      <Col span={16}>
        <div className="overflow-y-scroll h-[calc(100vh-80px)] p-5 w-full">
          <CustomTable
            data={allAlloys}
            totalCount={totalAlloysCount}
            titleOnTop={false}
            position="bottomRight"
            columns={columns}
            expandedData={expandedData}
            title="Current Stock"
            currentPage={currentPage}
            handlePageChange={setCurrentPage}
            pageSize={pageSize}
          />
        </div>
      </Col>
      <Col span={8}>
        <div className="h-[calc(100vh-120px)] p-5 m-5 bg-white rounded-lg shadow-modal relative">
          <div className="text-2xl font-semibold text-center font-poppins">
            Current Order Cart ({(currentOrder && currentOrder.length) || 0})
          </div>
          <Divider
            style={{
              margin: "15px 0px 0px 0px",
            }}
          />
          <div className="overflow-y-scroll max-h-[calc(100vh-260px)] ">
            {currentOrder.map((order) => (
              <div className="flex items-center justify-between p-2 mt-5 border rounded-md">
                <div>
                  <div className="text-lg font-medium">{order.modelName}</div>
                  <div className="text-sm font-extralight">{order.finish}</div>
                </div>
                <div className="flex items-center justify-end gap-x-5">
                  <div>{order.quantity}</div>
                  <Button onClick={() => removeFromOrder(order.modelId)}>
                    x
                  </Button>
                </div>
              </div>
            ))}
            {/* {JSON.stringify(currentData)} */}
          </div>
          <div className="absolute left-0 flex items-center justify-between w-full px-5 gap-x-5 bottom-5">
            <Button width="full" colors="alert">
              Cancel Order
            </Button>
            <Button width="full">Create Order</Button>
          </div>
        </div>
      </Col>
      <CustomModal
        setIsModalOpen={setIsModalOpen}
        isModalOpen={isModalOpen}
        title="Confirm"
        handleOk={() => handleAddToOrder()}
      >
        <div className="flex items-center justify-between p-2 my-5 border rounded-md">
          <div>
            <div className="text-lg font-medium">{currentData.modelName}</div>
            <div className="text-sm font-extralight">{currentData.finish}</div>
            <div className="flex items-center justify-start gap-x-2">
              <div className="text-sm font-bold">Available In House:</div>
              <div className="text-sm font-light">
                {currentData.inHouseStock}
              </div>
            </div>
            <div className="flex items-center justify-start gap-x-2">
              <div className="text-sm font-bold">Available In Showroom:</div>
              <div className="text-sm font-light">
                {currentData.showroomStock}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-5">
            <div>{currentData.quantity}</div>
          </div>
        </div>
        <CustomSelect
          style={{
            width: "100%",
            marginBottom: 10,
            height: "38px",
          }}
          showSearch={true}
          options={allFinishes}
          onChange={(e) => setConvertToFinish(e)}
        />
        <CustomInput
          border="primary"
          placeholder="Add Quantity"
          type="number"
          onChange={(e) =>
            setCurrentData({
              ...currentData,
              quantity: +e.target.value,
            })
          }
          max={currentData.inHouseStock + currentData.showroomStock}
        />
      </CustomModal>
    </Row>
  );
};

export default CreateProductionOrder;
