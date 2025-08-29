import React, { useState, useEffect } from "react";

const DataEntry = () => {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [noOfDays, setNoOfDays] = useState([]);
  const [blankDays, setBlankDays] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [rows, setRows] = useState([
    { stepCode: "", quantity: "", time: "", totalTime: "" },
  ]);

  useEffect(() => {
    getNoOfDays();
  }, [month, year]);

  const getNoOfDays = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOfWeek = new Date(year, month).getDay();

    let blankdaysArray = [];
    for (let i = 1; i <= dayOfWeek; i++) blankdaysArray.push(i);

    let daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

    setBlankDays(blankdaysArray);
    setNoOfDays(daysArray);
  };

  const isToday = (date) => {
    const today = new Date();
    const d = new Date(year, month, date);
    return today.toDateString() === d.toDateString();
  };

  const openModal = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setShowSuccessMessage(false);
    setRows([{ stepCode: "", quantity: "", time: "", totalTime: "" }]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setShowSuccessMessage(false);
  };

  const handleAddRow = () => {
    setRows([...rows, { stepCode: "", quantity: "", time: "", totalTime: "" }]);
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      closeModal();
    }, 3000);
    console.log("Dữ liệu đã lưu:", rows);
  };

  return (
    <div className="w-full h-screen overflow-x-hidden flex flex-col">
      <main className="w-full flex-grow p-6">
        <h1 className="text-3xl text-red-400 pb-6">Lịch nhập liệu</h1>

        <div className="w-full">
          <div className="antialiased sans-serif bg-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between py-2 px-4 sm:px-6">
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-gray-800">
                      {MONTH_NAMES[month]}
                    </span>
                    <span className="ml-1 text-lg text-gray-600 font-normal">
                      {year}
                    </span>
                  </div>
                  <div
                    className="border rounded-lg px-1 mt-2 sm:mt-0"
                    style={{ paddingTop: "2px" }}
                  >
                    <button
                      type="button"
                      className={`leading-none rounded-lg transition ease-in-out duration-100 inline-flex cursor-pointer hover:bg-gray-200 p-1 items-center ${
                        month === 0 ? "cursor-not-allowed opacity-25" : ""
                      }`}
                      disabled={month === 0}
                      onClick={() => setMonth(month - 1)}
                    >
                      <svg
                        className="h-6 w-6 text-gray-500 inline-flex leading-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="border-r inline-flex h-6"></div>
                    <button
                      type="button"
                      className={`leading-none rounded-lg transition ease-in-out duration-100 inline-flex items-center cursor-pointer hover:bg-gray-200 p-1 ${
                        month === 11 ? "cursor-not-allowed opacity-25" : ""
                      }`}
                      disabled={month === 11}
                      onClick={() => setMonth(month + 1)}
                    >
                      <svg
                        className="h-6 w-6 text-gray-500 inline-flex leading-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="-mx-1 -mb-1">
                  <div
                    className="flex flex-wrap"
                    style={{ marginBottom: "20px" }}
                  >
                    {DAYS.map((day, index) => (
                      <div
                        key={index}
                        className="w-[14.26%] text-center px-1 py-2"
                      >
                        <div className="text-blue-600 text-sm uppercase tracking-wide font-bold">
                          {day}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap border-t border-l">
                    {blankDays.map((_, index) => (
                      <div
                        key={index}
                        className="w-[14.28%] h-20 sm:h-32 text-center border-r border-b px-4 pt-2"
                      ></div>
                    ))}
                    {noOfDays.map((date, index) => (
                      <div
                        key={index}
                        className="w-[14.28%] h-20 sm:h-32 text-center border-r border-b px-4 pt-2 relative"
                      >
                        <div
                          onClick={() => openModal(date)}
                          className={`inline-flex w-6 h-6 sm:w-8 sm:h-8 items-center justify-center cursor-pointer text-center leading-none rounded-full transition ease-in-out duration-100 ${
                            isToday(date)
                              ? "bg-blue-500 text-white"
                              : "text-gray-700 hover:bg-blue-200"
                          }`}
                        >
                          {date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <input
        type="checkbox"
        id="booking-modal"
        className="modal-toggle"
        checked={isModalOpen}
        onChange={() => {}}
      />
      <div className="modal">
        <div className="modal-box w-full max-w-4xl px-4 sm:px-8">
          <h3 className="font-bold text-lg">
            Nhập liệu cho ngày {selectedDate}
          </h3>
          <form onSubmit={handleSave}>
            <div className="flex flex-wrap sm:flex-nowrap space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
              {/* Labels, chỉ một lần */}
              <div className="flex-1">
                <label className="label">
                  <span className="label-text">Mã công đoạn</span>
                </label>
              </div>
              <div className="flex-1">
                <label className="label">
                  <span className="label-text">Số lượng</span>
                </label>
              </div>
              <div className="flex-1">
                <label className="label">
                  <span className="label-text">Thời gian</span>
                </label>
              </div>
              
            </div>

            {/* Dòng dữ liệu, lặp qua từng dòng */}
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex flex-wrap sm:flex-nowrap space-y-4 sm:space-y-0 sm:space-x-4 mb-4"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Mã công đoạn"
                    className="input input-bordered w-full"
                    value={row.stepCode}
                    onChange={(e) =>
                      handleRowChange(index, "stepCode", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Số lượng"
                    className="input input-bordered w-full"
                    value={row.quantity}
                    onChange={(e) =>
                      handleRowChange(index, "quantity", e.target.value)
                    }
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Thời gian gia công"
                    className="input input-bordered w-full"
                    value={row.time}
                    onChange={(e) =>
                      handleRowChange(index, "time", e.target.value)
                    }
                  />
                </div>
                
              </div>
            ))}

            <button
              type="button"
              className="btn btn-sm btn-outline mb-4"
              onClick={handleAddRow}
            >
              Thêm dòng
            </button>

            {showSuccessMessage && (
              <div className="alert alert-success mb-4">
                <span>Lưu thành công!</span>
              </div>
            )}

            <div className="modal-action">
              <button type="button" className="btn" onClick={closeModal}>
                Đóng
              </button>
              <button type="submit" className="btn btn-primary">
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DataEntry;
