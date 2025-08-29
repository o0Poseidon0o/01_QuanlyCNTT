import React from "react";

export default function Forgotpassword() {
  return (
    <div className="h-screen flex justify-center items-center"> {/* Canh giữa cả chiều ngang và dọc */}
      <div className="flex w-full lg:w-1/2 justify-center items-center bg-white space-y-8">
        <div className="w-full px-8 md:px-32 lg:px-24">
          <form className="bg-white rounded-md shadow-2xl p-5">
            <h1 className="text-gray-800 font-bold text-2xl mb-1">Xin chào!</h1>
            <p className="text-sm font-normal text-gray-600 mb-8">
              Bạn hãy nhập đỉa chỉ email xin đổi password
            </p>
            <div className="flex items-center border-2 mb-8 py-2 px-3 rounded-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
              <input
                id="email"
                className="pl-2 w-full outline-none border-none"
                type="email"
                name="email"
                placeholder="Địa chỉ Email"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
