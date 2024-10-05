import React, { useState } from 'react';
import { Modal, DatePicker, Button, message } from 'antd';

const { RangePicker } = DatePicker;

const DownloadReportModal = ({ dealerName, onDownload }) => {
    const [visible, setVisible] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const handleRangeChange = (dates) => {
        if (dates) {
            setStartDate(dates[0].startOf('day').toISOString());
            setEndDate(dates[1].endOf('day').toISOString());
        } else {
            setStartDate(null);
            setEndDate(null);
        }
    };

    const handleDownload = () => {
        if (!startDate || !endDate) {
            message.error('Please select both start and end dates.');
            return;
        }

        onDownload({ dealerId: dealerName.id, dealerName: dealerName.name, startDate, endDate });
        setVisible(false); // Close modal after download
    };

    return (
        <>
            <Button onClick={() => setVisible(true)}>Download Report</Button>
            <Modal
                title={`Download Report for ${dealerName.name}`}
                visible={visible}
                onCancel={() => setVisible(false)}
                footer={null}
            >
                <p>Please select the start and end date to export the data for specific dates.</p>
                <RangePicker onChange={handleRangeChange} />
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <Button type="primary" onClick={handleDownload}>
                        Download
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default DownloadReportModal;