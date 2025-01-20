import React from "react";
import { useRea, useReaCompute, useRxStore, useRxFetch } from "../src/ReaHook";
import { Observable } from "rxjs";
import { ReaXar } from "../src/ReaXar";

type TestComponentProps = {
  type: "useRea" | "useReaCompute" | "useRxStore" | "useRxFetch";
  reaxar?: ReaXar<number>;
  observable?: Observable<number>;
  storeKey?: string;
  serviceKey?: string;
  fetchMethod?: (service: any) => Promise<void>;
};

export const TestComponent = ({
  type,
  reaxar,
  observable,
  storeKey,
  serviceKey,
  fetchMethod,
}: TestComponentProps) => {
  if (type === "useRea" && reaxar) {
    const value = useRea(reaxar);
    return <div>{value}</div>;
  }

  if (type === "useReaCompute" && observable) {
    const value = useReaCompute(observable);
    return <div>{value}</div>;
  }

  if (type === "useRxStore" && storeKey) {
    const value = useRxStore<number>(storeKey);
    return <div>{value ?? "undefined"}</div>;
  }

  if (type === "useRxFetch" && serviceKey && fetchMethod) {
    const { loading, error } = useRxFetch(serviceKey, fetchMethod);
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    return <div>Success</div>;
  }

  return <div>No hook type specified or invalid props.</div>;
};
