import { Row } from "antd";
import React, { useEffect, useState } from "react";
import CustomSelect from "../../Core/Components/CustomSelect";
import Button from "../../Core/Components/CustomButton";
import { useDispatch, useSelector } from "react-redux";
import {
  createAlloyEntry,
  getAllCbs,
  getAllFinishes,
  getAllHoles,
  getAllModels,
  getAllOffsets,
  getAllPcd,
  getAllSizes,
  getAllWidths,
} from "../../redux/api/stockAPI";
import CustomInput from "../../Core/Components/CustomInput";

const AddStock = () => {
  const {
    allPcd,
    allWidths,
    allModels,
    allSizes,
    allCbs,
    allFinishes,
    allHoles,
    allOffsets,
  } = useSelector((state) => state.stockDetails);
  const [alloyEntry, setAlloyEntry] = useState({
    modelId: null,
    cbId: null,
    finishId: null,
    holesId: null,
    inchesId: null,
    offsetId: null,
    pcdId: null,
    widthId: null,
    stock: null,
    showroomStock: null,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllPcd({}));
    dispatch(getAllWidths({}));
    dispatch(getAllModels({}));
    dispatch(getAllSizes({}));
    dispatch(getAllCbs({}));
    dispatch(getAllFinishes({}));
    dispatch(getAllHoles({}));
    dispatch(getAllOffsets({}));
  }, []);

  const handleAlloyCreate = () => {
    console.log(alloyEntry, "ALLOY ENTRY");
    dispatch(
      createAlloyEntry({
        modelId: alloyEntry.modelId,
        cbId: alloyEntry.cbId,
        finishId: alloyEntry.finishId,
        holesId: alloyEntry.holesId,
        inchesId: alloyEntry.inchesId,
        offsetId: alloyEntry.offsetId,
        pcdId: alloyEntry.pcdId,
        widthId: alloyEntry.widthId,
        stock: alloyEntry.stock,
        showroomStock: alloyEntry.showroomStock,
      })
    );
  };

  return (
    <div className="w-full h-full p-5 bg-background-grey">
      {/* <div className="px-5 mb-10 text-2xl font-semibold uppercase">
        Add Alloy
      </div> */}
      <Row gutter={16}>
        <div className="grid w-full grid-cols-4 gap-5">
          <div>
            <div>Select Model</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allModels}
              value={alloyEntry.modelId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  modelId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select PCD</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allPcd}
              value={alloyEntry.pcdId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  pcdId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select Size</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allSizes}
              value={alloyEntry.inchesId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  inchesId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select Holes</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allHoles}
              value={alloyEntry.holesId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  holesId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select CB</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allCbs}
              value={alloyEntry.cbId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  cbId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select Offset</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allOffsets}
              value={alloyEntry.offsetId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  offsetId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select Width</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allWidths}
              value={alloyEntry.widthId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  widthId: e,
                })
              }
            />
          </div>
          <div>
            <div>Select Finish</div>
            <CustomSelect
              showSearch={true}
              className="w-full"
              options={allFinishes}
              value={alloyEntry.finishId}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  finishId: e,
                })
              }
            />
          </div>
          <div>
            <div>Add In House Stock</div>
            <CustomInput
              type="number"
              value={alloyEntry.stock}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  stock: +e.target.value,
                })
              }
            />
          </div>
          <div>
            <div>Add Showroom Stock</div>
            <CustomInput
              type="number"
              value={alloyEntry.showroomStock}
              onChange={(e) =>
                setAlloyEntry({
                  ...alloyEntry,
                  showroomStock: +e.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-center w-full mt-10">
          <Button onClick={() => handleAlloyCreate()} width="login">
            Submit
          </Button>
        </div>
      </Row>
      <Row gutter={16}></Row>
    </div>
  );
};

export default AddStock;
