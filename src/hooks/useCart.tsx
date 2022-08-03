import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart'); //Buscar dados do localStorage
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      //IMUTABILIDADE
      const updatedCart = [...cart];
      const productsExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currentAmount = productsExists ? productsExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productsExists) {
        productsExists.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      // let counter = 0;
      // const { data } = await api.get(`/products/${productId}`);
      // //verifico se tem o produto
      // if (data) {
      //   //verifico a quantidade deste no estoque
      //   const stock = await api.get(`/stock/${productId}`);

      //   const newCart = [...cart, data];
      //   newCart.map((item) => {
      //     if (item.id === productId) {
      //       counter++;
      //     }
      //     return counter
      //   })
      //   if (stock.data.amount >= counter) {
      //     setCart(newCart);
      //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      //     // console.log(newCart.reduce)
      //   } else {
      //     toast.error('Quantidade solicitada fora de estoque');
      //     return;
      //   }
      // } else {
      //   return;
      // }
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const cartSearch = [...cart];
      const productsExists = cartSearch.find(product => product.id === productId);

      if (!productsExists) {
        toast.error('Erro na remoção do produto');
        return;
      }
      if (productsExists) {
        const updatedCart = cartSearch.filter(product => product !== productsExists);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const updatedCart = [...cart];
      const productsExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount < 1) {
        return;
      }

      if (productsExists) {
        if (stockAmount >= amount) {
          productsExists.amount = amount;
          setCart(updatedCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
