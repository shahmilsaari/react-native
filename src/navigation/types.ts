export type RootStackParamList = {
  Login: undefined;
  Packages: undefined;
  Profile: undefined;
  Bookings: undefined;
  PackageDetails: {
    packageId: string;
  };
  ServiceDetails: {
    serviceId: string;
  };
  BookingDetails: {
    bookingId: string;
  };
  MyCalendar: undefined;
  MyEventsList: undefined;
};
