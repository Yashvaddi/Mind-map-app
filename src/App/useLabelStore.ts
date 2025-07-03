import { create } from 'zustand';

type LabelState = {
  label: string;
  setLabel: (newLabel: string) => void;
};

const useLabelStore = create<LabelState>((set) => ({
  label: '',
  setLabel: (newLabel) => set({ label: newLabel }),
}));

export default useLabelStore;
