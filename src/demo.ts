import type { Contract, Option } from "./api";
export const services: Option[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Догляд за могилою" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Озеленення" },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Реставрація пам’ятника",
  },
  { id: "44444444-4444-4444-8444-444444444444", name: "Покладання квітів" },
];
export const regions: Option[] = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Львівська область" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Київська область" },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    name: "Івано-Франківська область",
  },
];
export const contracts: Contract[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    title: "Сезонний догляд за місцем поховання",
    description:
      "Прибрати опале листя, очистити пам’ятник та впорядкувати територію. Після завершення надіслати фотозвіт.",
    budget: 1200,
    status: "in_progress",
    date: "2026-12-15T12:00:00Z",
    serviceTypeId: services[0].id,
    regionId: regions[0].id,
    serviceType: services[0],
    region: regions[0],
    positionX: 49.84,
    positionY: 24.03,
    employeeId: "demo",
    employee: {
      id: "demo",
      name: "Олександр Мельник",
      rating: 4.9,
      reviewsCount: 24,
    },
    proposalsCount: 3,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    title: "Висадка багаторічних квітів",
    description:
      "Підібрати та висадити невибагливі багаторічні рослини біля пам’ятника.",
    budget: 2400,
    status: "open",
    date: "2026-12-20T10:00:00Z",
    serviceTypeId: services[1].id,
    regionId: regions[0].id,
    serviceType: services[1],
    region: regions[0],
    positionX: 49.84,
    positionY: 24.03,
    proposalsCount: 5,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    title: "Очищення та догляд за пам’ятником",
    description:
      "Дбайливе очищення гранітного пам’ятника та оновлення написів.",
    budget: 1800,
    status: "completed",
    date: "2026-11-03T12:00:00Z",
    serviceTypeId: services[2].id,
    regionId: regions[1].id,
    serviceType: services[2],
    region: regions[1],
    positionX: 50.45,
    positionY: 30.52,
    proposalsCount: 2,
    review: {
      id: "r",
      rating: 5,
      text: "Все виконано акуратно та вчасно. Дякую за турботу.",
    },
  },
];
