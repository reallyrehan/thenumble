import random
import re


def new_equation_generator(seed):
    random.seed(int(seed))
    op_list = ['+', '-', '/', '*']
    retry = True

    while True:
        ans_st = ""
        ans_ls = []

        while True:
            a = (random.randint(0,9))
            b = (op_list[random.randint(0,3)])
            ans_ls.append(a)
            ans_st = ans_st + str(a) +b

            if len(ans_st) > 7:
                break

        final_true = (ans_st[0:7])

        try:
            eval_result = eval(final_true)
            if eval_result == int(eval_result) and abs(eval_result)<200  and not re.search('(0\*)|(\*0)|(/0)|(0/)', final_true):
                retry = False

        except:
            pass

        if retry:
            continue
        else:
            break
    
    return final_true, eval_result