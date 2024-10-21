import { Row } from "antd";
import React, { useEffect, useState } from "react";
import CustomSelect from "../../Core/Components/CustomSelect";
import Button from "../../Core/Components/CustomButton";
import { useDispatch, useSelector } from "react-redux";
import {
    createCap,
    getAllCaps,
    getAllModels,
} from "../../redux/api/stockAPI";

const AddCapStock = () => {
    const {
        allModels,
    } = useSelector((state) => state.stockDetails);
    const [capEntry, setCapEntry] = useState({
        modelId: null,
    });

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getAllModels({}));
    }, []);

    const handleCreateCap = () => {
        dispatch(createCap({
            capModel: capEntry.modelId
        }));
        setCapEntry({
            modelId: null,
        })
    };

    console.log(allModels, 'ALLMODELS')

    return (
        <div className="w-full h-full p-5 bg-background-grey">
            <Row gutter={16}>
                <div className="grid w-full grid-cols-4 gap-5">
                    <div>
                        <div>Select Model</div>
                        <CustomSelect
                            showSearch={true}
                            className="w-full"
                            options={allModels}
                            value={capEntry.modelId}
                            onChange={(e, label) =>
                                setCapEntry({
                                    ...capEntry,
                                    modelId: label.label,
                                })
                            }
                        />
                    </div>
                </div>
                <div className="flex items-center justify-center w-full mt-10">
                    <Button onClick={() => handleCreateCap()} width="login">
                        Submit
                    </Button>
                </div>
            </Row>
            <Row gutter={16}></Row>
        </div>
    );
};

export default AddCapStock;
