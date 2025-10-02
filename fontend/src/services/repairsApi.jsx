// src/services/repairsApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

export const listRepairs = async (params = {}) => {
  const res = await axios.get(`${API_BASE}/repairs`, {
    params,
    headers: { "Cache-Control": "no-cache" },
  });
  return res.data;
};

export const getRepair = async (id) => {
  const res = await axios.get(`${API_BASE}/repairs/${id}`);
  return res.data;
};

export const createRepair = async (payload) => {
  const res = await axios.post(`${API_BASE}/repairs`, payload);
  return res.data;
};

export const updateStatus = async (id, payload) => {
  const res = await axios.patch(`${API_BASE}/repairs/${id}/status`, payload);
  return res.data;
};

export const upsertDetail = async (id, payload) => {
  const res = await axios.put(`${API_BASE}/repairs/${id}/detail`, payload);
  return res.data;
};

export const addPart = async (id, partOrArray) => {
  const list = Array.isArray(partOrArray) ? partOrArray : [partOrArray];
  const res = await axios.post(`${API_BASE}/repairs/${id}/parts`, list);
  return res.data;
};

export const uploadFiles = async (id, files, uploaded_by) => {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  if (uploaded_by) fd.append("uploaded_by", uploaded_by);
  const res = await axios.post(`${API_BASE}/repairs/${id}/files`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getSummaryStats = async () => {
  const res = await axios.get(`${API_BASE}/repairs/summary`, {
    params: { _ts: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return res.data;
};
