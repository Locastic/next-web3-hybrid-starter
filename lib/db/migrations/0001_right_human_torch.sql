-- inserts a row into public.profiles
CREATE OR REPLACE function public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER set search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, wallet_address, chain_id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'walletAddress', (NEW.raw_user_meta_data->>'chainId')::BIGINT, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$;

-- trigger the function every time a user is created
CREATE OR REPLACE trigger on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
