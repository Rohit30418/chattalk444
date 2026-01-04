import { createStore } from "@reduxjs/toolkit"
import { Reducer } from "./redux/Reducer";

export const store=createStore(Reducer);