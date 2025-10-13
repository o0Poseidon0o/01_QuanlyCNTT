/* eslint-disable */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ROUTES } from "./config/routes";
import PermissionRoute from "./components/unitls/PermissionRoute";

const App = () => {
  return (
    <Router>
      <Routes>
        {ROUTES.map(({ path, component: Component, rule }, i) => {
          const element = <Component />;
          // public
          if (!rule || !rule.anyOf?.length && !rule.allOf?.length && !rule.notAnyOf?.length) {
            return <Route key={i} path={path} element={element} />;
          }
          // guarded
          return (
            <Route
              key={i}
              path={path}
              element={
                <PermissionRoute
                  anyOf={rule.anyOf}
                  allOf={rule.allOf}
                  notAnyOf={rule.notAnyOf}
                >
                  {element}
                </PermissionRoute>
              }
            />
          );
        })}
      </Routes>
    </Router>
  );
};

export default App;
