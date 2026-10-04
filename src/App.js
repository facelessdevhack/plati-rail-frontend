import React from "react";
import store from "./redux/store";
import { Provider } from "react-redux";
import StackNavigation from "./Core/Navigation/StackNavigation";
import { BrowserRouter } from "react-router-dom";
import { setupAxiosInterceptors } from "./Utils/axiosClient";
import GlobalLoader from "./Core/Components/GlobalLoader";
import { useGlobalLoading } from "./Utils/globalLoading";
import SessionExpiryBoundary from "./Core/Navigation/SessionExpiryBoundary";
import PasskeySessionBoundary from './Core/Navigation/PasskeySessionBoundary';

// Setup axios interceptors when the app starts
setupAxiosInterceptors();

const GlobalLoaderMount = () => {
  const inFlight = useGlobalLoading();
  return <GlobalLoader visible={inFlight > 0} />;
};

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <SessionExpiryBoundary />
      <GlobalLoaderMount />
      <PasskeySessionBoundary><StackNavigation /></PasskeySessionBoundary>
    </BrowserRouter>
  </Provider>
);

export default App;
