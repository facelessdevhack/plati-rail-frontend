import React from "react";
import store from "./redux/store";
import { Provider } from "react-redux";
import StackNavigation from "./Core/Navigation/StackNavigation";

const App = () => (
  <Provider store={store}>
    <StackNavigation />
  </Provider>
);

export default App;
