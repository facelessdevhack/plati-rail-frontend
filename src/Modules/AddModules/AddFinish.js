import { Row, Spin, notification } from "antd";
import React, { useEffect, useState } from "react";
import CustomSelect from "../../Core/Components/CustomSelect";
import Button from "../../Core/Components/CustomButton";
import { useDispatch, useSelector } from "react-redux";
import {
  addFinishes,
} from "../../redux/api/stockAPI";
import CustomInput from "../../Core/Components/CustomInput";
import { setSuccessToInit } from "../../redux/slices/stock.slice";

const AddFinish = () => {
  const { loading, success, error } = useSelector(state => state.stockDetails);
  const [finish, setFinish] = useState(null);
  const dispatch = useDispatch();

  // Handle success and error feedback
  useEffect(() => {
    if (success === true) {
      notification.success({
        message: 'Success',
        description: 'Finish added successfully.',
      });
    } else if (error !== {}) {
      notification.error({
        message: 'Error',
        description: 'Failed to add finish. Please try again.',
      });
    }
  }, [success, error]);

  const handleCreateFinish = () => {
    if (finish) {
      dispatch(addFinishes({
        finish: finish
      }));
      setFinish(null);
      setSuccessToInit()
    } else {
      notification.warning({
        message: 'Input Required',
        description: 'Please enter a finish name before submitting.',
      });
    }
  };

  return (
    <div className="w-full h-full p-5 bg-background-grey">
      <Row gutter={16}>
        {loading && <Spin spinning={loading} fullscreen={true} />}
        <div className="grid w-full grid-cols-4 gap-5">
          <div>
            <div>Type Finish Name</div>
            <CustomInput
              value={finish}
              placeholder={'Enter Finish Name'}
              onChange={(e) => setFinish(e.target.value)}
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

export default AddFinish;