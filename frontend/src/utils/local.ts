export const saveState = (name: string, value: any) => {
  localStorage.setItem(name, JSON.stringify(value));
};

export const getState = (name: string) => {
  const state = localStorage.getItem(name);
  if (state) {
    return JSON.parse(state);
  } else {
    return null;
  }
};
