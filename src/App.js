import React from "react";
import store from "./redux/store";
import { Provider } from "react-redux";
import StackNavigation from "./Core/Navigation/StackNavigation";
import { BrowserRouter } from "react-router-dom";


const App = () => (
  <Provider store={store}>
    <BrowserRouter>

      <StackNavigation />
    </BrowserRouter>
  </Provider>
);

export default App;
