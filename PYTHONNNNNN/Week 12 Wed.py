# 22/10/2025
# revision for assignment 3

# ask the user their favoutite sport and what their best friends name is, then display a personal message
# ask for their fav sport with prompt "What is your favoutite sport? "
# ask what the uses best friends name is with the prompt: "What is your best friends name? "
# with the details inputted print: "Playing [sport] with [friend] sounds like fun!"
# then replace [sport] with their chosen sport and [friend] with their best friends name

# Sport = input("What is your favourite sport? ").strip().lower()
# Friend = input("What is your best friends name? ").capitalize().strip()
# print(f"Playing {Sport} with {Friend} sounds like fun!")




# Write a program to compare the lengths of two words entered by the user:
# frist, ask the user to enter the first work with the prompt "Enter the first word"
# next, ask the user to enter the second work with the prompt "enter the second word"
# compare the lengths of the two words
# if the first work is longer print: "The first word is longer"
# if the second word is longer print "the second word is longer"
# if both words are equal length print "Both words are the same length"

First = input("Enter the first word: ").strip().capitalize()
Second = input("Enter the second word: ").strip().capitalize()
if First > Second:
    print("The first word is longer")
elif Second > First:
    print("The second word is longer")
elif First == Second:
    print("Both words are the same length")
else:
    print("Error")

# This time pull the length of charaters in each word
First = input("Enter the first word: ").strip().capitalize()
FirstNum = len(First)
Second = input("Enter the second word: ").strip().capitalize()
SecondNum = len(Second)
if len(First) > len(Second):
    print(f"{First} ({FirstNum}) is longer than {Second} ({SecondNum})")
elif len(First) < len(Second):
    print(f"{Second} ({SecondNum}) is longer than {First} ({FirstNum})")
elif len(First) == len(Second):
    print(f"{First} ({FirstNum}) and {Second} ({SecondNum}) are the same length")
else:
    print("Error")

# write a program to check a users answer to a simple multiplication question
# 1. ask the users, what is 3x3
# handle the input as follows
# - if the user enters something that is not a number print: that is not a number!
# -if the answer is 9, print "Correct!"
# if it's a number but not 9, print "Incorrect, that is not the right answer."
# note, for this question you can assume there will not be an negative numbers or fractions as the input, we are only accepting whole positive numbers

Answer = input("What is 3x3? ").strip()
if Answer.isdigit():
    if int(Answer) == 9:
        print("Correct!")
    else:
        print("Incorrect, that is not the right answer.")

