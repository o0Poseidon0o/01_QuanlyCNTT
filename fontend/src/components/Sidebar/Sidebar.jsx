/*eslint-disable*/
import React from "react";
import { Link } from "react-router-dom";

import UserDropdown from "../Dropdowns/UserDropdown";
import { useState } from "react";

export default function Sidebar() {
  const [collapseShow, setCollapseShow] = useState("hidden");
  return (
    <>
      <nav className="md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden shadow-xl bg-white flex flex-wrap items-center justify-between relative md:w-64 z-50 py-4 px-6">
        <div className="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto">
          {/* Toggler */}
          <button
            className="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
            type="button"
            onClick={() => setCollapseShow("bg-white m-2 py-3 px-6")}
          >
            <i className="fas fa-bars"></i>
          </button>
          {/* Brand */}
          <Link
            className="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
            to="/"
          >
            Towa Viet Nam
          </Link>
          {/* User */}
          <ul className="md:hidden items-center flex flex-wrap list-none">
            <li className="inline-block relative">
              <UserDropdown />
            </li>
          </ul>
          {/* Collapse */}
          <div
            className={
              "md:flex md:flex-col md:items-stretch md:opacity-100 md:relative md:mt-4 md:shadow-none shadow absolute top-0 left-0 right-0 z-40 overflow-y-auto overflow-x-hidden h-auto items-center flex-1 rounded " +
              collapseShow
            }
          >
            {/* Collapse header */}
            <div className="md:min-w-full md:hidden block pb-4 mb-4 border-b border-solid border-blueGray-200">
              <div className="flex flex-wrap">
                <div className="w-6/12">
                  <Link
                    className="md:block text-left md:pb-2 text-blueGray-600 mr-0 inline-block whitespace-nowrap text-sm uppercase font-bold p-4 px-0"
                    to="/"
                  >
                    Towa Viet Nam
                  </Link>
                </div>
                <div className="w-6/12 flex justify-end">
                  <button
                    type="button"
                    className="cursor-pointer text-black opacity-50 md:hidden px-3 py-1 text-xl leading-none bg-transparent rounded border border-solid border-transparent"
                    onClick={() => setCollapseShow("hidden")}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            {/* Form */}
            <form className="mt-6 mb-4 md:hidden">
              <div className="mb-3 pt-0">
                <input
                  type="text"
                  placeholder="Search"
                  className="border-0 px-3 py-2 h-12 border-solid  border-blueGray-500 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-base leading-snug shadow-none outline-none focus:outline-none w-full font-normal"
                />
              </div>
            </form>
            {/* Divider */}
            <hr className="my-4 md:min-w-full" />
            {/* Heading */}
            <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
              Quản lý thiết bị CNTT
            </h6>
            {/* Navigation */}

            <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4">
              {/* Menu Quản lý Role và Phòng ban */}
              <li className="relative group">
                <a className="text-blueGray-700 hover:text-red-600 text-xs uppercase py-3 font-bold block">
                  <i className="fas fa-fingerprint text-blueGray-400 mr-2 text-sm"></i>{" "}
                  Các loại thiết bị
                </a>

                {/* Menu con */}
                <ul className="hidden group-hover:block bg-white shadow-lg py-2 border-l-4 border-blueGray-300 mt-2">
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Techequipment"
                    >
                      Danh sách thông tin thiết bị
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Repairhistory"
                    >
                      Lịch sử sửa chữa
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Staticsequipment"
                    >
                      Thống kê
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
            {/* Divider */}
            <hr className="my-4 md:min-w-full" />
            {/* Heading */}
            <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
              Văn bản
            </h6>
            {/* Navigation */}

            <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4">
              {/* Menu Quản lý Role và Phòng ban */}
              <li className="relative group">
                <a className="text-blueGray-700 hover:text-red-600 text-xs uppercase py-3 font-bold block">
                  <i className="fas fa-fingerprint text-blueGray-400 mr-2 text-sm"></i>{" "}
                  Các loại văn bản
                </a>

                {/* Menu con */}
                <ul className="hidden group-hover:block bg-white shadow-lg py-2 border-l-4 border-blueGray-300 mt-2">
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/DocumentsManagement"
                    >
                      Quản lý văn bản
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="#"
                    >
                      Danh sách văn bản
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>

            {/* Divider */}
            <hr className="my-4 md:min-w-full" />
            {/* Heading */}
            <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
              Quản lý
            </h6>
            {/* Navigation */}

            <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4">
              {/* Menu Quản lý Role và Phòng ban */}
              <li className="relative group">
                <a className="text-blueGray-700 hover:text-red-600 text-xs uppercase py-3 font-bold block">
                  <i className="fas fa-fingerprint text-blueGray-400 mr-2 text-sm"></i>{" "}
                  Quản lý Role và phòng ban
                </a>

                {/* Menu con */}
                <ul className="hidden group-hover:block bg-white shadow-lg py-2 border-l-4 border-blueGray-300 mt-2">
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/RoleDepartment"
                    >
                      Quản lý Role
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Department"
                    >
                      Quản lý Phòng ban
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Menu Quản lý User */}
              <li className="relative group">
                <a className="text-blueGray-700 hover:text-red-600 text-xs uppercase py-3 font-bold block">
                  <i className="fas fa-fingerprint text-blueGray-400 mr-2 text-sm"></i>{" "}
                  Quản lý User
                </a>

                {/* Menu con */}
                <ul className="hidden group-hover:block bg-white shadow-lg py-2 border-l-4 border-blueGray-300 mt-2">
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Adduser"
                    >
                      Thêm User
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/SettingUser"
                    >
                      Quản lý User
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>

            {/* Divider */}
            <hr className="my-4 md:min-w-full" />
            {/* Heading */}
            <h6 className="md:min-w-full text-blueGray-500 text-xs uppercase font-bold block pt-1 pb-4 no-underline">
              Các Trang chức năng
            </h6>
            {/* Navigation */}

            <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4">
              <li className="relative group">
                <a className="text-blueGray-700 hover:text-red-600 text-xs uppercase py-3 font-bold block">
                  <i className="fas fa-fingerprint text-blueGray-400 mr-2 text-sm"></i>{" "}
                  Nhập liệu BCDB
                </a>

                {/* Menu con */}
                <ul className="hidden group-hover:block bg-white shadow-lg py-2 border-l-4 border-blueGray-300 mt-2">
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Dataentry"
                    >
                      Lịch nhập liệu
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="block px-4 py-2 text-blueGray-700 hover:text-red-600"
                      to="/Chartview"
                    >
                      Tổng hợp
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="items-center">
                <Link
                  className="text-blueGray-700 hover:text-red-600 y-500 text-xs uppercase py-3 font-bold block"
                  to="/userprofile"
                >
                  <i className="fas fa-user-circle text-blueGray-400 mr-2 text-sm"></i>{" "}
                  Profile Page
                </Link>
              </li>
            </ul>
            {/* Footer */}
            <footer className="mt-auto text-center py-4 border-t border-blueGray-200">
              <p className="text-blueGray-500 text-sm">
                © {new Date().getFullYear()} Towa Việt Nam.
              </p>
              <p className="text-blueGray-400 text-xs">
                <Link to="/terms" className="hover:text-red-600">
                  Copyright
                </Link>{" "}
                |{" "}
                <Link to="/privacy" className="hover:text-red-600">
                  Lê Minh Nhân
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </nav>
    </>
  );
}
