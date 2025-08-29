import React from "react";

const Unauthorized = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>403 - Unauthorized</h1>
      <p>Bạn không có quyền vào phần này !!!!!!!!</p>
      <a href="/">Go to Login</a>
    </div>
  );
};

export default Unauthorized;
