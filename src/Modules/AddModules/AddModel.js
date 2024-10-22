import { Row, Spin, notification } from "antd";
import React, { useEffect, useState } from "react";
import Button from "../../Core/Components/CustomButton";
import { useDispatch, useSelector } from "react-redux";
import {
  addModel,
} from "../../redux/api/stockAPI";
import CustomInput from "../../Core/Components/CustomInput";
import { setSuccessToInit } from "../../redux/slices/stock.slice";

const AddModel = () => {
  const { loading } = useSelector(state => state.stockDetails);
  const [model, setModel] = useState(null);
  const dispatch = useDispatch();


  const handleCreateFinish = () => {
    dispatch(addModel({
      model
    }));
    setModel(null);
    setSuccessToInit()
  };

  return (
    <div className="w-full h-full p-5 bg-background-grey">
      <Row gutter={16}>
        {loading && <Spin spinning={loading} fullscreen={true} />}
        <div className="grid w-full grid-cols-4 gap-5">
          <div>
            <div>Type Model Name</div>
            <CustomInput
              value={model}
              placeholder={'Enter Model Name'}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-center w-full mt-10">
          <Button onClick={() => handleCreateFinish()} width="login" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </Row>
    </div>
  );
};

export default AddModel;