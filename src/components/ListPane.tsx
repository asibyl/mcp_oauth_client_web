import { Button, Box, Text, Flex, ButtonGroup } from "@chakra-ui/react";

type ListPaneProps<T> = {
  items: T[];
  listItems: () => void;
  clearItems: () => void;
  setSelectedItem: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  title: string;
  buttonText: string;
  isButtonDisabled?: boolean;
};

const ListPane = <T extends object>({
  items,
  listItems,
  clearItems,
  setSelectedItem,
  renderItem,
  title,
  buttonText,
  isButtonDisabled,
}: ListPaneProps<T>) => (
    <Box p={4} rounded="md" gap={4}>
        <Text fontWeight="medium">{title}</Text>
        <ButtonGroup size="xs" variant="solid" gap={2}>
            <Button onClick={listItems} disabled={isButtonDisabled} colorPalette="green">
                {buttonText}
            </Button>
            <Button onClick={clearItems} disabled={items.length === 0}>
                Clear
            </Button>
        </ButtonGroup>
        
        <Flex flexDirection="column" mt={6} gap={4}>
            {items.map((item, index) => (
                <Box gap={2} alignContent="flex-start" key={index} onClick={() => setSelectedItem(item)}>
                    {renderItem(item)}
                </Box>
            ))}
        </Flex>
    </Box> 
);

export default ListPane;