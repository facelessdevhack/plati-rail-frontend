import React from 'react';
import CustomSelect from '../../Core/Components/CustomSelect';
import CustomInput from '../../Core/Components/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { getDealersDropdown } from '../../redux/api/stockAPI';
import Button from '../../Core/Components/CustomButton';
import {
    setPMEntry,
    resetPMEntry,
} from '../../redux/slices/entry.slice';
import { client } from '../../Utils/axiosClient';
import { getPaymentDailyEntry, getPaymentMethods } from '../../redux/api/entriesAPI';

const AddPMEntry = () => {
    const dispatch = useDispatch();
    const { pmEntry, isEditing, allPaymentMethods, allPaymentDailyEntries } = useSelector((state) => state.entryDetails);
    const { dealersDropdown } = useSelector((state) => state.stockDetails);

    React.useEffect(() => {
        dispatch(getDealersDropdown({}));
        dispatch(getPaymentMethods({}))
        dispatch(getPaymentDailyEntry({}))
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
                paymentMethod: pmEntry.paymentMethod,
            });
            if (response) {
                dispatch(resetPMEntry());
            }
            return response.data;
        } catch (e) {
            console.log(e, 'ERROR');
        }
    };

    console.log(allPaymentDailyEntries, 'allPaymentDailyEntries')

    const getPaymentMethodLabel = (methodId) => {
        const method = allPaymentMethods?.find((method) => method.id === methodId);
        return method ? method.methodName : 'Unknown Method';
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
                                options={dealersDropdown || []}
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
                        {/* <div className="col-span-2">
                            <div>Payment Method</div>
                            <div>
                                <label>
                                    <input
                                        style={{ marginRight: '3px' }}
                                        type="radio"
                                        name="paymentMethod"
                                        value="Cheque"
                                        checked={pmEntry.isCheque === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ paymentMethod: 1 })
                                            );
                                        }}
                                    />
                                    Cheque
                                </label>
                                <label className="ml-4">
                                    <input
                                        style={{ marginRight: '3px' }}
                                        type="radio"
                                        name="paymentMethod"
                                        value="NEFT"
                                        checked={pmEntry.isNEFT === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ paymentMethod: 2 })
                                            );
                                        }}
                                    />
                                    NEFT
                                </label>
                                <label>
                                    <input
                                        style={{ marginRight: '3px' }}
                                        type="radio"
                                        name="paymentMethod"
                                        value="RTGS"
                                        checked={pmEntry.isRTGS === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ paymentMethod: 3 })
                                            );
                                        }}
                                    />
                                    RTGS
                                </label>
                                <label>
                                    <input
                                        style={{ marginRight: '3px' }}
                                        type="radio"
                                        name="paymentMethod"
                                        value="MMT"
                                        checked={pmEntry.isMMT === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ paymentMethod: 4 })
                                            );
                                        }}
                                    />
                                    MMT
                                </label>
                                <label>
                                    <input
                                        style={{ marginRight: '3px' }}
                                        type="radio"
                                        name="paymentMethod"
                                        value="INF"
                                        checked={pmEntry.isINF === 1}
                                        onChange={() => {
                                            dispatch(
                                                setPMEntry({ paymentMethod: 5 })
                                            );
                                        }}
                                    />
                                    INF
                                </label>
                            </div>
                        </div> */}
                        <div>
                            <div>Payment Method</div>
                            <div className='flex justify-start'>
                                {allPaymentMethods?.map((method) => (
                                    <label key={method.id} className="mr-4 flex justify-start gap-x-2">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method.id}
                                            checked={pmEntry.paymentMethod === method.id}
                                            onChange={() =>
                                                dispatch(setPMEntry({ paymentMethod: method.id }))
                                            }
                                        />
                                        {method.methodName}
                                    </label>
                                ))}
                            </div>
                            {/* {errors.paymentMethod && (
                                <div className="error">{errors.paymentMethod}</div>
                            )} */}
                        </div>
                    </div>
                    <div className="flex items-center justify-end mt-5 gap-x-4">
                        <Button onClick={handleAddPMEntry}>
                            {isEditing ? 'Update Entry' : 'Create Entry'}
                        </Button>
                    </div>
                </div>
                <div className="h-full col-span-3 border-2">
                    <div className="col-span-3 h-[calc(100vh-135px)] bg-white overflow-y-scroll p-5">
                        {Object.entries(
                            (allPaymentDailyEntries || [])?.reduce((acc, entry) => {
                                const { dealerName } = entry;
                                if (!acc[dealerName]) {
                                    acc[dealerName] = [];
                                }
                                acc[dealerName].push(entry);
                                return acc; // Return the accumulator after processing each entry
                            }, {}) || {},
                        ).map(([dealerName, entries]) => (
                            <div key={dealerName} className="mb-8">
                                <div className="pb-2 mb-4 text-2xl font-bold border-b border-gray-300">
                                    {dealerName}
                                </div>
                                {entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={`flex items-center justify-between p-4 mb-4 border rounded-lg shadow-md border-gray-300 bg-gray-50`}
                                    >
                                        <div>
                                            <div className="text-lg font-medium">
                                                {/* {entry.paymentMethod} */}
                                                {getPaymentMethodLabel(entry.paymentMethod)}
                                            </div>
                                            <div className="flex items-center justify-start mt-2 gap-x-5">
                                                <div>
                                                    <div className="flex items-center justify-start gap-x-2">
                                                        <div className="font-medium">Quantity:</div>
                                                        <div>{entry.description}</div>
                                                    </div>
                                                    <div className="flex items-center justify-start gap-x-2">
                                                        <div className="font-medium">Amount:</div>
                                                        <div>{entry.isClaim ? 'Claim' : entry.amount}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPMEntry;