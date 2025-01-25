import React from "react";
import WorkerDetailsCard from "@/components/Profile/WorkerDetailsCard";

const workerDetailsProps = {
  workerInfo: {
    name: "Santiago Villarreal",
    role: "AI Engineer",
    joiningDate: "March 2020"
  },
  statistics: {
    jobsDeliveredOnTime: 9,
    jobsCompletedWithoutBudget: 9,
    acceptanceRate: 9,
  },
  location: {
    country: "Italy",
    localTime: "20:23",
  },
  rate: {
    pricePerJob: 100.01,
  },
  contacts: {
    email: "santivillarley1010@gmail.com",
    phone: "86776886",
  },
};

export default function Page() {
  return (
    <WorkerDetailsCard
      workerInfo={workerDetailsProps.workerInfo}
      statistics={workerDetailsProps.statistics}
      location={workerDetailsProps.location}
      rate={workerDetailsProps.rate}
      contacts={workerDetailsProps.contacts}
    />
  );
}
