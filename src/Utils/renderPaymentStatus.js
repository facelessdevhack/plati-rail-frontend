import {
    PAYMENT_PENDING,
    PAYMENT_PARTIAL,
    PAYMENT_PAID,
    PAYMENT_OVERDUE,
  } from './constants';
  
  export function renderPaymentStatus(paymentStatus) {
    let styles = {};
  
    switch (paymentStatus) {
      case PAYMENT_PENDING:
        styles = {
          border: '1px solid orange',
          backgroundColor: 'rgba(255, 165, 0, 0.1)', // Faded orange
          color: 'orange',
        };
        return <div style={{ ...boxStyle, ...styles }}>Pending</div>;
  
      case PAYMENT_PARTIAL:
        styles = {
          border: '0.5px solid blue',
          backgroundColor: 'rgba(0, 0, 255, 0.2)', // Faded blue
          color: 'blue',
        };
        return <div style={{ ...boxStyle, ...styles }}>Partial</div>;
  
      case PAYMENT_PAID:
        styles = {
          border: '0.5px solid green',
          backgroundColor: 'rgba(0, 128, 0, 0.2)', // Faded green
          color: 'green',
        };
        return <div style={{ ...boxStyle, ...styles }}>Paid</div>;
  
      case PAYMENT_OVERDUE:
        styles = {
          border: '0.5px solid red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)', // Faded red
          color: 'red',
        };
        return <div style={{ ...boxStyle, ...styles }}>Overdue</div>;
  
      default:
        styles = {
          border: '0.5px solid gray',
          backgroundColor: 'rgba(128, 128, 128, 0.2)', // Faded gray
          color: 'gray',
        };
        return <div style={{ ...boxStyle, ...styles }}>Unknown</div>;
    }
  }
  
  const boxStyle = {
    display: 'inline-block',
    padding: '2.5px 4px',
    borderRadius: '5px',
    fontWeight: 'bold',
    textAlign: 'center',
    width: 'fit-content',
    fontSize: '12px'
  };