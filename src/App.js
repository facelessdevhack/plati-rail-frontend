import React from "react";
import store from "./redux/store";
import { Provider } from "react-redux";
import StackNavigation from "./Core/Navigation/StackNavigation";
import { BrowserRouter } from "react-router-dom";
import { setupAxiosInterceptors } from "./Utils/axiosClient";

// Setup axios interceptors when the app starts
setupAxiosInterceptors();

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <StackNavigation />
    </BrowserRouter>
  </Provider>
);

export default App;
