import React from 'react';
import CustomSelect from '../../Core/Components/CustomSelect';
import CustomInput from '../../Core/Components/CustomInput';
import { useDispatch, useSelector } from 'react-redux';
import { getAllDealers, getAllProducts } from '../../redux/api/stockAPI';
import Button from '../../Core/Components/CustomButton';
import {
  setEntry,
  resetEntry,
  addEntry,
  updateEntryById,
  deleteEntryById,
  setEditing,
} from '../../redux/slices/entry.slice';
import { addEntryAPI, editEntryAPI, getDailyEntry, getTodayDataEntry, removeEntryAPI } from '../../redux/api/entriesAPI';

const AddDailyEntry = () => {
  const dispatch = useDispatch();
  const { allEntries, entry, isEditing, editingEntryId, allDailyEntries } = useSelector(
    (state) => state.entryDetails,
  );
  const [reloadAPI, setReloadAPI] = React.useState(false);
  const { allDealers, allProducts } = useSelector(
    (state) => state.stockDetails,
  );

  React.useEffect(() => {
    dispatch(getAllDealers({}));
    dispatch(getAllProducts({}));
    dispatch(getDailyEntry({}))
    // console.log(allDailyEntries)
  }, [dispatch]);

  React.useEffect(() => {
    dispatch(getDailyEntry({}))
  }, [reloadAPI]);

  const generateUniqueId = () => {
    return `entry-${Date.now()}-${Math.random()}`;
  };

  const handleCreateEntry = async () => {
    if (!entry.dealerId || !entry.dealerName) {
      alert('Please select a dealer before submitting.');
      return;
    }

    if (!entry.productId || !entry.productName) {
      alert('Please select a product before submitting.');
      return;
    }

    if (!entry.quantity) {
      alert('Please enter a quantity before submitting.');
      return;
    }

    if (entry.isClaim && entry.price !== 0) {
      alert('Price should be 0 when claiming.');
      return;
    }

    if (!entry.isClaim && entry.price === null) {
      alert('Please enter a price before submitting.');
      return;
    }

    if (
      entry.transportationType !== '' &&
      entry.transportationCharges === null
    ) {
      alert(
        'Please enter transportation charges when a transportation type is selected.',
      );
      return;
    }

    if (isEditing) {
      try {
        console.log(entry, 'EDITING ENTRY ID')
        const editEntryResponse = await editEntryAPI({ ...entry, id: editingEntryId || entry.entryId, sourceType: entry.sourceType })
        if (editEntryResponse.status === 200) {
          console.log(editEntryResponse, 'editEntryResponse');
          dispatch(updateEntryById({ ...entry, id: editingEntryId }));
          dispatch(setEditing({ isEditing: false, editingEntryId: null }));
        }
      } catch (error) {
        console.log(error, 'error');
      }
    } else {
      try {
        const addEntryResponse = await addEntryAPI({ ...entry })
        if (addEntryResponse.status === 200) {
          console.log(addEntryResponse, 'addEntryResponse');
          const entryWithEntryId = { ...entry, entryId: addEntryResponse.data?.[0] };
          dispatch(addEntry({ ...entryWithEntryId, id: generateUniqueId() }));
        }
      } catch (error) {
        console.log(error, 'error');
      }
    }

    dispatch(resetEntry());
    setReloadAPI(!reloadAPI)
  };

  const handleDelete = async (id) => {
    try {
      const removeEntryResponse = await removeEntryAPI({ entryId: id })
      if (removeEntryResponse) {
        console.log(removeEntryResponse, 'removeEntryResponse');
        dispatch(deleteEntryById(id));
      }
    } catch (error) {
      console.log(error, 'error');
    }
  };

  const handleEdit = (entry) => {
    dispatch(setEntry(entry));
    dispatch(setEditing({ isEditing: true, editingEntryId: entry.id }));
  };

  const handleCancelEdit = () => {
    dispatch(resetEntry());
    dispatch(setEditing({ isEditing: false, editingEntryId: null }));
  };

  const handleClaimToggle = () => {
    dispatch(
      setEntry({
        isClaim: !entry.isClaim,
        price: !entry.isClaim ? 0 : null,
      }),
    );
  };

  const handleRepairToggle = () => {
    dispatch(
      setEntry({
        isRepair: !entry.isRepair,
      }),
    );
  };

  const handleProductType = () => {
    console.log(entry.productType, 'PRODUCT TYPE')
    dispatch(
      setEntry({
        productType: entry.productType === 1 ? 2 : 1,
      }),
    );
  };

  const handleTransportationChange = (e) => {
    dispatch(
      setEntry({
        transportationType: e.target.value,
      }),
    );
  };

  const handleTransportationChargesChange = (e) => {
    dispatch(
      setEntry({
        transportationCharges: +e.target.value,
      }),
    );
  };

  return (
    <div>
      {/* Your JSX code, using allEntries from Redux */}
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
                value={entry.dealerId}
                placeholder="Select a dealer"
                onChange={(e, l) => {
                  dispatch(
                    setEntry({
                      dealerId: e,
                      dealerName: l ? l.label : null,
                    }),
                  );
                }}
              />
            </div>
            <div>
              <div>Select Product</div>
              <CustomSelect
                showSearch={true}
                className="w-full"
                options={allProducts}
                value={entry.productId}
                onChange={(e, l) => {
                  dispatch(
                    setEntry({
                      productId: e,
                      productName: l ? l.label : null,
                    }),
                  )
                  console.log(e, l.label, 'SELECTED PRODUCT')
                }
                }
              />
            </div>
            <div>
              <div>Quantity</div>
              <CustomInput
                type="number"
                value={entry.quantity}
                onChange={(e) =>
                  dispatch(
                    setEntry({
                      quantity: +e.target.value,
                    }),
                  )
                }
              />
            </div>
            <div>
              <div>Price</div>
              <CustomInput
                type="number"
                value={entry.isClaim ? '' : entry.price}
                disabled={entry.isClaim}
                placeholder={entry.isClaim ? 'Claim' : ''}
                onChange={(e) =>
                  dispatch(
                    setEntry({
                      price: +e.target.value,
                      isClaim: false,
                    }),
                  )
                }
              />
            </div>
            <div>
              <div className="pb-2 font-bold">Transportation Charges</div>
              <div className="flex mb-4 gap-x-4">
                <label>
                  <input
                    type="radio"
                    value="Transport"
                    checked={entry.transportationType === 'Transport'}
                    onChange={handleTransportationChange}
                  />
                  <span className="ml-2">Transport</span>
                </label>
                <label>
                  <input
                    type="radio"
                    value="Bus"
                    checked={entry.transportationType === 'Bus'}
                    onChange={handleTransportationChange}
                  />
                  <span className="ml-2">Bus</span>
                </label>
                <label>
                  <input
                    type="radio"
                    value=""
                    checked={entry.transportationType === ''}
                    onChange={handleTransportationChange}
                  />
                  <span className="ml-2">None</span>
                </label>
              </div>
              {entry.transportationType && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="font-semibold">Transportation Charges:</div>
                  <CustomInput
                    type="number"
                    value={entry.transportationCharges || ''}
                    onChange={handleTransportationChargesChange}
                    placeholder="Enter charges"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-start gap-x-2">
              <label>
                <input
                  type="checkbox"
                  checked={entry.isClaim}
                  onChange={handleClaimToggle}
                />
                <span className="ml-2">Claim</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={entry.isRepair}
                  onChange={handleRepairToggle}
                />
                <span className="ml-2">Repair</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={entry.productType === 2}
                  onChange={handleProductType}
                />
                <span className="ml-2">isCap</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end mt-5 gap-x-4 ">
            {isEditing && <Button onClick={handleCancelEdit}>Cancel</Button>}
            <Button onClick={handleCreateEntry}>
              {isEditing ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </div>

        <div className="h-full col-span-3 border-2">
          <div className="col-span-3 h-[calc(100vh-135px)] bg-white overflow-y-scroll p-5">
            {Object.entries(
              allDailyEntries?.reduce((acc, entry) => {
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
                    className={`flex items-center justify-between p-4 mb-4 border rounded-lg shadow-md ${entry.id === editingEntryId
                      ? 'border-green-500 shadow-lg shadow-green-200'
                      : 'border-gray-300 bg-gray-50'
                      }`}
                  >
                    <div>
                      <div className="text-lg font-medium">
                        {entry.productName}
                      </div>
                      <div className="flex items-center justify-start mt-2 gap-x-5">
                        <div>
                          <div className="flex items-center justify-start gap-x-2">
                            <div className="font-medium">Quantity:</div>
                            <div>{entry.quantity}</div>
                          </div>
                          <div className="flex items-center justify-start gap-x-2">
                            <div className="font-medium">Price:</div>
                            <div>{entry.isClaim ? 'Claim' : entry.price}</div>
                          </div>
                        </div>
                        <div>
                          {entry.transportationCharges && (
                            <div className="flex items-center justify-start gap-x-2">
                              <div className="font-medium">
                                Transportation Charges:
                              </div>
                              <div>{entry.transportationCharges}</div>
                            </div>
                          )}
                          {entry.transportationType && (
                            <div className="flex items-center justify-start gap-x-2">
                              <div className="font-medium">
                                Transportation Type:
                              </div>
                              <div className="text-sm font-light">
                                {entry.transportationType}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-4">
                      <Button onClick={() => handleEdit(entry)}>Edit</Button>
                      {/* <Button onClick={() => handleDelete(entry.entryId)}>
                        Delete
                      </Button> */}
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

export default AddDailyEntry;
