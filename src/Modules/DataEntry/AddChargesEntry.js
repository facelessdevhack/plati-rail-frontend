import React from 'react';
import CustomSelect from '../../Core/Components/CustomSelect';
import CustomInput from '../../Core/Components/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { getDealersDropdown } from '../../redux/api/stockAPI';
import Button from '../../Core/Components/CustomButton';
import {
  setChargesEntry,
  resetChargesEntry,
} from '../../redux/slices/entry.slice';
import { client } from '../../Utils/axiosClient';
import { getChargesDailyEntry } from '../../redux/api/entriesAPI';

const AddChargesEntry = () => {
  const dispatch = useDispatch();
  const { chargesEntry, isEditing, allPaymentMethods, allChargesDailyEntries } = useSelector((state) => state.entryDetails);
  const { dealersDropdown } = useSelector((state) => state.stockDetails);

  React.useEffect(() => {
    dispatch(getDealersDropdown({}));
    dispatch(getChargesDailyEntry({}))
  }, []);

  const handleAddPMEntry = async () => {
    if (!chargesEntry.dealerId || !chargesEntry.dealerName) {
      alert('Please select a dealer before submitting.');
      return;
    }

    if (!chargesEntry.description) {
      alert('Please enter a description before submitting.');
      return;
    }

    if (!chargesEntry.amount) {
      alert('Please enter an amount before submitting.');
      return;
    }

    if (!chargesEntry.payment_date) {
      alert('Please select a payment date before submitting.');
      return;
    }

    try {
      const response = await client.post('entries/create-charges-entry', {
        ...chargesEntry,
      });
      if (response) {
        dispatch(resetChargesEntry());
      }
      return response.data;
    } catch (e) {
      console.log(e, 'ERROR');
    }
  };

  console.log(allChargesDailyEntries, 'allChargesDailyEntries')

  const getPaymentMethodLabel = (methodId) => {
    const method = allPaymentMethods.find((method) => method.id === methodId);
    return method ? method.methodName : 'Unknown Method';
  };

  return (
    <div>
      <div className="grid h-[calc(100vh-135px)] grid-cols-6">
        <div className="h-full col-span-3 p-5 border-2">
          <div className="pb-5 text-2xl font-bold text-center">
            {isEditing ? 'Edit Entry' : 'Create Charges Entry'}
          </div>
          <div className="grid w-full grid-cols-2 gap-5">
            <div>
              <div>Select Dealer</div>
              <CustomSelect
                showSearch={true}
                className="w-full"
                options={dealersDropdown}
                value={chargesEntry?.dealerId}
                placeholder="Select a dealer"
                onChange={(e, l) => {
                  dispatch(
                    setChargesEntry({
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
                value={chargesEntry?.description}
                onChange={(e) =>
                  dispatch(
                    setChargesEntry({
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
                value={chargesEntry?.amount}
                placeholder={'Enter Amount'}
                onChange={(e) =>
                  dispatch(
                    setChargesEntry({
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
                value={chargesEntry?.payment_date}
                onChange={(e) =>
                  dispatch(
                    setChargesEntry({
                      payment_date: e.target.value,
                    }),
                  )
                }
              />
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
              allChargesDailyEntries?.reduce((acc, entry) => {
                const { dealerName } = entry;
                if (!acc[dealerName]) {
                  acc[dealerName] = [];
                }
                acc[dealerName].push(entry);
                return acc; // Return the accumulator after processing each entry
              }, {}),
            ).map(([dealerName, entries]) => (
              <div key={dealerName} className="mb-8">
                <div className="pb-2 mb-4 text-2xl font-bold border-b border-gray-300">
                  {dealerName}
                </div>
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 mb-4 border rounded-lg shadow-md border-gray-300 bg-gray-50 w-full`}
                  >
                    <div className="flex items-center justify-between w-full gap-x-5">
                      <div className="flex items-center justify-start gap-x-2">
                        <div className="font-medium">Description:</div>
                        <div>{entry.description}</div>
                      </div>
                      <div className="flex items-center justify-start gap-x-2">
                        <div className="font-medium">Amount:</div>
                        <div>{entry.amount ? 'Rs.' + entry.amount : ''}</div>
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

export default AddChargesEntry;