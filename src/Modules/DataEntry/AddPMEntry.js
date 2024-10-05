import React from 'react';
import CustomSelect from '../../Core/Components/CustomSelect';
import CustomInput from '../../Core/Components/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { getAllDealers } from '../../redux/api/stockAPI';
import Button from '../../Core/Components/CustomButton';
import {
    setPMEntry,
    resetPMEntry,
} from '../../redux/slices/entry.slice';
import { client } from '../../Utils/axiosClient';

const AddPMEntry = () => {
    const dispatch = useDispatch();
    const { pmEntry, isEditing } = useSelector((state) => state.entryDetails);
    const { allDealers } = useSelector((state) => state.stockDetails);

    React.useEffect(() => {
        dispatch(getAllDealers({}));
    }, []);

    const handleAddPMEntry = async () => {
        if (!pmEntry.dealerId || !pmEntry.dealerName) {
            alert('Please select a dealer before submitting.');
            return;
        }

        if (!pmEntry.description) {
            alert('Please enter a description before submitting.');
            return;
        }

        if (!pmEntry.amount) {
            alert('Please enter an amount before submitting.');
            return;
        }

        if (!pmEntry.payment_date) {
            alert('Please select a payment date before submitting.');
            return;
        }

        try {
            const response = await client.post('entries/create-pm-entry', {
                ...pmEntry,
                isCheque: pmEntry.isCheque ? 1 : 0,
                isNEFT: pmEntry.isNEFT ? 1 : 0,
            });
            if (response) {
                dispatch(resetPMEntry());
            }
            return response.data;
        } catch (e) {
            console.log(e, 'ERROR');
        }
    };

    return (
        <div>
            <div className="grid h-[calc(100vh-135px)] grid-cols-6">
                <div className="h-full col-span-3 p-5 border-2">
                    <div className="pb-5 text-2xl font-bold text-center">
                        {isEditing ? 'Edit Entry' : 'Create New Entry'}
                    </div>
                    <div className="grid w-full grid-cols-2 gap-5">
                        <div>
                            <div>Select Dealer</div>
                            <CustomSelect
                                showSearch={true}
                                className="w-full"
                                options={allDealers}
                                value={pmEntry?.dealerId}
                                placeholder="Select a dealer"
                                onChange={(e, l) => {
                                    dispatch(
                                        setPMEntry({
                                            dealerId: e,
                                            dealerName: l ? l.label : null,
                                        }),
                                    );
                                }}
                            />
                        </div>
                        <div>
                            <div>Description</div>
                            <CustomInput
                                value={pmEntry?.description}
                                onChange={(e) =>
                                    dispatch(
                                        setPMEntry({
                                            description: e.target.value,
                                        }),
                                    )
                                }
                            />
                        </div>
                        <div>
                            <div>Amount</div>
                            <CustomInput
                                type="number"
                                value={pmEntry?.amount}
                                placeholder={'Enter Amount'}
                                onChange={(e) =>
                                    dispatch(
                                        setPMEntry({
                                            amount: +e.target.value,
                                        }),
                                    )
                                }
                            />
                        </div>
                        <div>
                            <div>Payment Date</div>
                            <CustomInput
                                type="date"
                                value={pmEntry?.payment_date}
                                onChange={(e) =>
                                    dispatch(
                                        setPMEntry({
                                            payment_date: e.target.value,
                                        }),
                                    )
                                }
                            />
                        </div>
                        <div className="col-span-2">
                            <div>Payment Method</div>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="Cheque"
                                        checked={pmEntry.isCheque === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ isCheque: 1, isNEFT: 0 })
                                            );
                                        }}
                                    />
                                    Cheque
                                </label>
                                <label className="ml-4">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="NEFT"
                                        checked={pmEntry.isNEFT === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ isCheque: 0, isNEFT: 1 })
                                            );
                                        }}
                                    />
                                    NEFT
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end mt-5 gap-x-4">
                        <Button onClick={handleAddPMEntry}>
                            {isEditing ? 'Update Entry' : 'Create Entry'}
                        </Button>
                    </div>
                </div>

                {/* Render entries here... */}
            </div>
        </div>
    );
};

export default AddPMEntry;